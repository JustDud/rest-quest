from __future__ import annotations

import json
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np


try:
    import cv2
except Exception:
    cv2 = None

# Import DeepFace first (it tends to be self-contained) and keep mediapipe optional.
try:
    from deepface import DeepFace
except Exception:
    DeepFace = None

try:
    import mediapipe as mp
except Exception:
    mp = None

# FER fallback (lighter-weight emotion detector) — used when DeepFace/native TF isn't available.
try:
    from fer import FER
except Exception:
    FER = None

EMOTION_KEYS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
EMOTION_LOG = Path("project/emotion_results.jsonl")


def normalize_scores(raw: Dict[str, float]) -> Dict[str, float]:
    total = sum(raw.values())
    if not total:
        total = 1.0
    return {key: raw.get(key, 0.0) / total for key in EMOTION_KEYS}


class EmotionAggregator:
    def __init__(self) -> None:
        self.reset()

    def reset(self) -> None:
        self.totals = {key: 0.0 for key in EMOTION_KEYS}
        self.duration = 0.0
        self.last_scores: Optional[Dict[str, float]] = None

    def add(self, scores: Optional[Dict[str, float]], delta: float) -> None:
        if not scores:
            scores = self.last_scores
        if not scores or delta <= 0:
            return
        for key in EMOTION_KEYS:
            self.totals[key] += scores.get(key, 0.0) * delta
        self.duration += delta
        self.last_scores = scores

    def summary(self) -> Dict[str, float]:
        if self.duration <= 0:
            return {"neutral": 1.0}
        return {key: value / self.duration for key, value in self.totals.items()}

    def dominant(self) -> str:
        scores = self.summary()
        return max(scores, key=scores.get)



class EmotionVisualizer:
    def __init__(self, camera_index: int = 0) -> None:
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            raise RuntimeError("Unable to open the camera.")
        # Use MediaPipe face detection when available; otherwise fall back to OpenCV Haar cascades.
        if mp is not None:
            try:
                # mirror trial_cam approach: keep references to face detection and drawing utils
                self.mp_face = mp.solutions.face_detection
                self.mp_draw = mp.solutions.drawing_utils
                self.mp_face_mesh = mp.solutions.face_mesh
                self.detector = self.mp_face.FaceDetection(min_detection_confidence=0.5)
                try:
                    self.face_mesh = self.mp_face_mesh.FaceMesh(
                        static_image_mode=False,
                        max_num_faces=1,
                        refine_landmarks=True,
                        min_detection_confidence=0.5,
                        min_tracking_confidence=0.5,
                    )
                    self.face_connections = self.mp_face_mesh.FACEMESH_TESSELATION
                    self.face_oval = self.mp_face_mesh.FACEMESH_FACE_OVAL
                except Exception:
                    self.face_mesh = None
                    self.face_connections = None
                    self.face_oval = None
                self.use_mediapipe = True
            except Exception:
                self.detector = None
                self.use_mediapipe = False
                self.face_mesh = None
                self.face_connections = None
                self.face_oval = None
        else:
            self.detector = None
            self.use_mediapipe = False
            self.face_mesh = None
            self.face_connections = None
            self.face_oval = None

        if not self.use_mediapipe:
            # Haar cascades provided by OpenCV
            try:
                cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
                self.haar = cv2.CascadeClassifier(cascade_path)
            except Exception:
                self.haar = None

        # Analyze every frame for more responsive detection (can be tuned down if CPU-heavy)
        self.analysis_stride = 1
        self.frame_counter = 0
        self.last_scores: Optional[Dict[str, float]] = None
        self.last_label = "neutral"
        # Track whether we've already warned about DeepFace failures (avoid spamming)
        self._deepface_warned = False
        # Create an async analyzer to avoid blocking the main capture loop
        try:
            self.analyzer = EmotionAnalyzer(use_deepface=True)
        except Exception:
            self.analyzer = None

    def release(self) -> None:
        if self.cap:
            self.cap.release()
        if getattr(self, "analyzer", None) is not None:
            try:
                self.analyzer.stop()
            except Exception:
                pass
        if getattr(self, "face_mesh", None) is not None:
            try:
                self.face_mesh.close()
            except Exception:
                pass
        cv2.destroyAllWindows()

    def _analyze_emotion(self, roi: Any) -> Optional[Dict[str, float]]:
        # Prefer DeepFace if available; fall back to FER if DeepFace fails or is not installed.
        if DeepFace is not None:
            try:
                # Convert to RGB and resize to a reasonable size for the analyzer
                if roi is None or roi.size == 0:
                    return None
                try:
                    roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
                except Exception:
                    roi_rgb = roi
                # Resize while preserving aspect ratio, but don't upscale too small images
                h, w = roi_rgb.shape[:2]
                target = 224
                if h < target or w < target:
                    scale = target / max(h, w)
                    new_w = int(w * scale)
                    new_h = int(h * scale)
                    roi_rgb = cv2.resize(roi_rgb, (new_w, new_h))

                result = DeepFace.analyze(
                    roi_rgb,
                    actions=["emotion"],
                    enforce_detection=False,
                    detector_backend="opencv",
                )
                if isinstance(result, list):
                    result = result[0]
                # DeepFace usually returns an 'emotion' dict; if not, try dominant_emotion
                emotions = result.get("emotion") if isinstance(result, dict) else None
                if not emotions:
                    dom = result.get("dominant_emotion") if isinstance(result, dict) else None
                    if dom:
                        emotions = {k: 0.0 for k in EMOTION_KEYS}
                        # Map DeepFace labels to our EMOTION_KEYS if necessary
                        key = dom.lower()
                        if key in emotions:
                            emotions[key] = 1.0
                        else:
                            emotions["neutral"] = 1.0
                if emotions:
                    return normalize_scores(emotions)
            except Exception as exc:
                # If DeepFace fails for any reason, log once and fall back to FER
                if not getattr(self, "_deepface_warned", False):
                    print(f"[warn] DeepFace analyze failed: {exc}")
                    self._deepface_warned = True
                pass

        if FER is not None:
            try:
                detector = FER(mtcnn=True)
                em = detector.detect_emotions(cv2.cvtColor(roi, cv2.COLOR_BGR2RGB))
                if em:
                    # FER returns list of dicts with 'emotions'
                    top = em[0].get("emotions", {})
                    return normalize_scores(top)
            except Exception:
                return None

        return None

    # Small wrappers: some processing helpers were left defined under EmotionAnalyzer
    # (they're implemented there so we can reuse that code). Provide thin wrappers
    # so the EmotionVisualizer instance exposes the expected methods.
    def _draw_mask(self, frame: Any, bbox: Tuple[int, int, int, int]) -> None:
        # delegate to the function object defined on EmotionAnalyzer (works because
        # it accepts 'self' as the first parameter and expects the visualizer's attrs)
        try:
            return EmotionAnalyzer._draw_mask(self, frame, bbox)
        except Exception:
            # best-effort fallback: draw a basic rectangle
            x1, y1, x2, y2 = bbox
            try:
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            except Exception:
                pass

    def process_frame(self) -> Tuple[Any, Optional[Dict[str, float]]]:
        try:
            return EmotionAnalyzer.process_frame(self)
        except Exception:
            # If delegation fails, return a blank frame and no scores
            try:
                ret, frame = self.cap.read()
                if not ret:
                    raise RuntimeError("Failed to read from camera.")
                frame = cv2.flip(frame, 1)
                return frame, None
            except Exception:
                raise

    


class EmotionAnalyzer:
    """Background emotion analyzer worker.

    Usage: create instance, call submit(roi) to send the latest face ROI for analysis.
    The worker keeps only the most recent ROI (queue size 1) and updates last_scores.
    Call stop() to shut it down.
    """

    def __init__(self, use_deepface: bool = True):
        import queue

        self._use_deepface = use_deepface and (DeepFace is not None)
        self._use_fer = FER is not None
        self._q = queue.Queue(maxsize=1)
        self.last_scores: Optional[Dict[str, float]] = None
        self._running = True
        self._thread = threading.Thread(target=self._worker, daemon=True)
        self._thread.start()

    def submit(self, roi: Any) -> None:
        # Non-blocking: replace any pending ROI with the newest one
        try:
            if self._q.full():
                _ = self._q.get_nowait()
            self._q.put_nowait(roi)
        except Exception:
            pass

    def get_scores(self) -> Optional[Dict[str, float]]:
        return self.last_scores

    def stop(self) -> None:
        self._running = False
        try:
            # wake worker
            self._q.put_nowait(None)
        except Exception:
            pass
        self._thread.join(timeout=1.0)

    def _worker(self) -> None:
        while self._running:
            try:
                roi = self._q.get()
            except Exception:
                roi = None
            if roi is None:
                time.sleep(0.01)
                continue

            scores = None
            # Preprocess roi
            try:
                roi_rgb = cv2.cvtColor(roi, cv2.COLOR_BGR2RGB)
            except Exception:
                roi_rgb = roi

            # Try DeepFace first (more robust but slower)
            if self._use_deepface:
                try:
                    r = DeepFace.analyze(roi_rgb, actions=["emotion"], enforce_detection=False, detector_backend="opencv")
                    if isinstance(r, list):
                        r = r[0]
                    emotions = r.get("emotion") if isinstance(r, dict) else None
                    if not emotions:
                        dom = r.get("dominant_emotion") if isinstance(r, dict) else None
                        if dom:
                            emotions = {k: 0.0 for k in EMOTION_KEYS}
                            key = dom.lower()
                            emotions[key if key in emotions else "neutral"] = 1.0
                    if emotions:
                        scores = normalize_scores(emotions)
                except Exception:
                    # fall through to FER
                    pass

            # FER fallback (fast) if DeepFace didn't produce scores
            if scores is None and self._use_fer:
                try:
                    detector = FER(mtcnn=False)
                    em = detector.detect_emotions(roi_rgb)
                    if em:
                        top = em[0].get("emotions", {})
                        scores = normalize_scores(top)
                except Exception:
                    scores = None

            if scores is not None:
                self.last_scores = scores
            time.sleep(0.01)

    def _draw_mask(self, frame: Any, bbox: Tuple[int, int, int, int]) -> None:
        x1, y1, x2, y2 = bbox
        # Draw a clear rectangle and (later) the emotion label similar to trial_cam
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

        # Save last bbox for placing the label if needed
        self._last_bbox = (x1, y1, x2, y2)


    def process_frame(self) -> Tuple[Any, Optional[Dict[str, float]]]:
        ret, frame = self.cap.read()
        if not ret:
            raise RuntimeError("Failed to read from camera.")

        frame = cv2.flip(frame, 1)
        self.frame_counter += 1

        scores = None

        if self.use_mediapipe and self.detector is not None:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            self._overlay_face_mesh(frame, rgb)
            detection = self.detector.process(rgb)
            if detection and getattr(detection, "detections", None):
                detection_box = detection.detections[0].location_data.relative_bounding_box
                h, w, _ = frame.shape
                x1 = max(int(detection_box.xmin * w), 0)
                y1 = max(int(detection_box.ymin * h), 0)
                x2 = min(x1 + int(detection_box.width * w), w)
                y2 = min(y1 + int(detection_box.height * h), h)

                if (x2 - x1) > 0 and (y2 - y1) > 0:
                    face_roi = frame[y1:y2, x1:x2]
                    if (
                        self.frame_counter % self.analysis_stride == 0
                        or self.last_scores is None
                    ):
                        if getattr(self, "analyzer", None) is not None:
                            try:
                                self.analyzer.submit(face_roi)
                                analyzed = self.analyzer.get_scores()
                            except Exception:
                                analyzed = None
                        else:
                            analyzed = self._analyze_emotion(face_roi)
                        if analyzed:
                            self.last_scores = analyzed
                            self.last_label = max(analyzed, key=analyzed.get)
                    self._draw_mask(frame, (x1, y1, x2, y2))
                    text_pos = (x1, max(30, y1 - 15))
                else:
                    text_pos = (20, 40)
            else:
                text_pos = (20, 40)
        else:
            # Haar cascade fallback
            text_pos = (20, 40)
            if self.haar is not None:
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.haar.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60))
                if len(faces) > 0:
                    x, y, w_box, h_box = faces[0]
                    x1, y1, x2, y2 = x, y, x + w_box, y + h_box
                    face_roi = frame[y1:y2, x1:x2]
                    if (
                        self.frame_counter % self.analysis_stride == 0
                        or self.last_scores is None
                    ):
                        if getattr(self, "analyzer", None) is not None:
                            try:
                                self.analyzer.submit(face_roi)
                                analyzed = self.analyzer.get_scores()
                            except Exception:
                                analyzed = None
                        else:
                            analyzed = self._analyze_emotion(face_roi)
                        if analyzed:
                            self.last_scores = analyzed
                            self.last_label = max(analyzed, key=analyzed.get)
                    self._draw_mask(frame, (x1, y1, x2, y2))

        if self.last_scores:
            scores = dict(self.last_scores)

        # If a face was detected and labeled, draw that near the box; otherwise draw the last label
        if self.last_label and text_pos is not None:
            label_text = (self.last_label or "neutral").upper()
            cv2.putText(frame, label_text, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2, cv2.LINE_AA)

        # Show listening indicator when active
        if getattr(self, "is_listening", False):
            h, w = frame.shape[:2]
            cv2.putText(frame, "LISTENING...", (w//2 - 100, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2, cv2.LINE_AA)

        # (voice detection removed) — we only show LISTENING when collecting frames

        return frame, scores

    def _face_oval_points(self, landmarks, width: int, height: int) -> Optional[np.ndarray]:
        if not getattr(self, "face_oval", None):
            return None
        seen = set()
        points = []
        for connection in self.face_oval:
            for idx in connection:
                if idx in seen:
                    continue
                lm = landmarks.landmark[idx]
                points.append((int(lm.x * width), int(lm.y * height)))
                seen.add(idx)
        if len(points) < 3:
            return None
        return np.array(points, dtype=np.int32)

    def _overlay_face_mesh(self, frame: Any, rgb_frame: Any) -> None:
        if not getattr(self, "face_mesh", None):
            return
        try:
            results = self.face_mesh.process(rgb_frame)
        except Exception:
            return
        if not results.multi_face_landmarks:
            return
        height, width, _ = frame.shape
        for face_landmarks in results.multi_face_landmarks:
            if getattr(self, "face_connections", None):
                self.mp_draw.draw_landmarks(
                    image=frame,
                    landmark_list=face_landmarks,
                    connections=self.face_connections,
                    landmark_drawing_spec=None,
                    connection_drawing_spec=self.mp_draw.DrawingSpec(color=(25, 113, 194), thickness=1, circle_radius=1),
                )
            points = self._face_oval_points(face_landmarks, width, height)
            if points is None:
                continue
            overlay = frame.copy()
            cv2.fillPoly(overlay, [points], (25, 113, 194))
            cv2.addWeighted(overlay, 0.15, frame, 0.85, 0, frame)


def append_emotion_log(entry: Dict[str, object]) -> None:
    EMOTION_LOG.parent.mkdir(parents=True, exist_ok=True)
    payload = {"timestamp": datetime.utcnow().isoformat(), **entry}
    with EMOTION_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def format_spectrum(spectrum: Dict[str, float], top: int = 3) -> str:
    items = sorted(spectrum.items(), key=lambda kv: kv[1], reverse=True)
    chunks = []
    for emotion, value in items[:top]:
        percent = int(round(value * 100))
        if percent <= 0:
            continue
        chunks.append(f"{emotion} {percent}%")
    return ", ".join(chunks) if chunks else "neutral 100%"


def collect_emotions_for_duration(
    visualizer: EmotionVisualizer,
    aggregator: EmotionAggregator,
    seconds: float,
    window_name: str = "Emotion Tracker",
) -> None:
    start = time.time()
    prev_time = start
    while time.time() - start < seconds:
        frame, scores = visualizer.process_frame()
        now = time.time()
        aggregator.add(scores, now - prev_time)
        prev_time = now

        cv2.imshow(window_name, frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            raise KeyboardInterrupt


def collect_emotions_until_event(
    visualizer: EmotionVisualizer,
    aggregator: EmotionAggregator,
    stop_event: threading.Event,
    max_seconds: float,
    window_name: str = "Emotion Tracker",
) -> None:
    start = time.time()
    prev_time = start
    while not stop_event.is_set() and (time.time() - start) < max_seconds:
        frame, scores = visualizer.process_frame()
        now = time.time()
        aggregator.add(scores, now - prev_time)
        prev_time = now

        cv2.imshow(window_name, frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            raise KeyboardInterrupt


def warmup_detection(visualizer: EmotionVisualizer, aggregator: EmotionAggregator, seconds: float = 2.0) -> None:
    """Quick warm-up to collect baseline emotion scores before asking the question."""
    start = time.time()
    prev = start
    while time.time() - start < seconds:
        frame, scores = visualizer.process_frame()
        now = time.time()
        aggregator.add(scores, now - prev)
        prev = now
        cv2.imshow("Emotion Tracker", frame)
        if cv2.waitKey(1) & 0xFF == ord("q"):
            raise KeyboardInterrupt
