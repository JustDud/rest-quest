# import sys
# import cv2
# import mediapipe as mp
# from deepface import DeepFace

# def main(camera_index: int = 0, min_detection_confidence: float = 0.5):
#     mp_face = mp.solutions.face_detection
#     mp_draw = mp.solutions.drawing_utils

#     cap = cv2.VideoCapture(camera_index)
#     if not cap.isOpened():
#         print("Cannot open camera", camera_index)
#         return

#     with mp_face.FaceDetection(min_detection_confidence=min_detection_confidence) as face_detector:
#         while True:
#             ret, frame = cap.read()
#             if not ret:
#                 print("Failed to read frame from camera")
#                 break

#             # Mirroring
#             frame = cv2.flip(frame, 1)
            
#             # Convert BGR to RGB for MediaPipe
#             rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
#             results = face_detector.process(rgb)

#             if results.detections:
#                 for det in results.detections:
#                     bboxC = det.location_data.relative_bounding_box
#                     h, w, _ = frame.shape
#                     x1 = int(bboxC.xmin * w)
#                     y1 = int(bboxC.ymin * h)
#                     x2 = x1 + int(bboxC.width * w)
#                     y2 = y1 + int(bboxC.height * h)

#                     # Crop the face region
#                     face_roi = frame[max(0, y1):y2, max(0, x1):x2]

#                     if face_roi.size > 0:
#                         try:
#                             # Analyze emotion with DeepFace
#                             result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)
#                             emotion = result[0]['dominant_emotion']
#                             cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
#                             cv2.putText(frame, emotion, (x1, y1 - 10),
#                                         cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2, cv2.LINE_AA)
#                         except Exception as e:
#                             print("Emotion detection error:", e)
#                             pass
#                     else:
#                         cv2.putText(frame, "No Face Detected", (50, 50),
#                                     cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2, cv2.LINE_AA)

#             cv2.imshow("Emotion Detection (press 'q' to quit)", frame)
#             if cv2.waitKey(1) & 0xFF == ord('q'):
#                 break

#     cap.release()
#     cv2.destroyAllWindows()

# if __name__ == "__main__":
#     idx = 0
#     conf = 0.5
#     if len(sys.argv) > 1:
#         try:
#             idx = int(sys.argv[1])
#         except Exception:
#             pass
#     if len(sys.argv) > 2:
#         try:
#             conf = float(sys.argv[2])
#         except Exception:
#             pass
#     main(camera_index=idx, min_detection_confidence=conf)






import cv2
import mediapipe as mp
from deepface import DeepFace
import numpy as np
import time
import textwrap
import json
from pathlib import Path
from collections import deque

try:
    from fer import FER
except ImportError:
    FER = None

# Landmark indices that approximate the outer contour of a face oval
FACE_OVAL_LANDMARKS = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
]

# Base classes returned by DeepFace
EMOTION_KEYS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]

# Simple Plutchik-inspired combinations for richer states without retraining.
COMPLEX_EMOTION_MIXES = {
    "delight": ("happy", "surprise"),
    "awe": ("surprise", "fear"),
    "anxiety": ("fear", "sad"),
    "frustration": ("angry", "sad"),
    "contempt": ("angry", "disgust"),
    "contentment": ("happy", "neutral"),
    "boredom": ("sad", "neutral"),
    "determination": ("angry", "neutral"),
}

# Mock travel data path
# Data/config paths
TRAVEL_DATA_PATH = Path(__file__).with_name("mock_travel_data.json")
MOCK_RESPONSE_VIDEOS = [
    Path(__file__).with_name("mock_answer_q1.mp4"),
    Path(__file__).with_name("mock_answer_q2.mp4"),
]
# Conversation script (can be replaced with ElevenLabs prompts)
QUESTIONS = [
    "How are you feeling today?",
    "What is something that recently made you smile or feel proud?"
]


def normalize_emotion_dict(raw_scores):
    total = sum(raw_scores.values())
    total = total if total else 1.0
    normalized = {}
    for key in EMOTION_KEYS:
        normalized[key] = raw_scores.get(key, 0.0) / total
    return normalized


class EmotionSmoother:
    def __init__(self, keys, window=15):
        self.keys = keys
        self.history = deque(maxlen=window)

    def reset(self):
        self.history.clear()

    def update(self, raw_scores):
        normalized = normalize_emotion_dict(raw_scores)
        self.history.append(normalized)
        return self.average()

    def has_data(self):
        return len(self.history) > 0

    def average(self):
        if not self.history:
            return {key: 0.0 for key in self.keys}
        avg = {key: 0.0 for key in self.keys}
        for entry in self.history:
            for key in self.keys:
                avg[key] += entry.get(key, 0.0)
        count = len(self.history)
        return {key: value / count for key, value in avg.items()}

class ComplexEmotionResolver:
    def __init__(self, mixes):
        self.mixes = mixes

    def derive_complex_emotions(self, base_scores):
        complex_scores = {}
        for label, components in self.mixes.items():
            values = [base_scores.get(name, 0.0) for name in components]
            if not values:
                continue
            complex_scores[label] = sum(values) / len(values)
        return complex_scores

    def pick_label(self, base_scores):
        complex_scores = self.derive_complex_emotions(base_scores)
        combined = dict(base_scores)
        combined.update(complex_scores)
        if not combined:
            return "unknown", 0.0, complex_scores
        label = max(combined, key=combined.get)
        return label, combined[label], complex_scores


class ConversationController:
    def __init__(
        self,
        questions,
        prompt_duration=3.0,
        response_duration=8.0,
        report_duration=2.0,
    ):
        self.questions = questions
        self.prompt_duration = prompt_duration
        self.response_duration = response_duration
        self.report_duration = report_duration
        self.state = "init"
        self.state_started_at = time.time()
        self.current_index = -1
        self.results = []
        self.live_label = "waiting"
        self.live_confidence = 0.0
        self.live_blend = ""
        self.current_histogram = self._blank_histogram()
        self.histogram_total = 0.0

    def start(self):
        self._advance_to_prompt()

    def _advance_to_prompt(self):
        self.current_index += 1
        if self.current_index >= len(self.questions):
            self.state = "done"
            return
        self.state = "prompt"
        self.state_started_at = time.time()

    def update_state(self):
        now = time.time()
        if self.state == "prompt" and (now - self.state_started_at) >= self.prompt_duration:
            self.state = "listening"
            self.state_started_at = now
            return "reset"

        if self.state == "listening" and (now - self.state_started_at) >= self.response_duration:
            self.state = "report"
            self.state_started_at = now
            return "finalize"

        if self.state == "report" and (now - self.state_started_at) >= self.report_duration:
            self._advance_to_prompt()

        return None

    def record_result(self, label, confidence, spectrum):
        self.results.append(
            {
                "question": self.current_question_text(),
                "label": label,
                "confidence": confidence,
                "spectrum": spectrum,
            }
        )

    def current_question_text(self):
        if 0 <= self.current_index < len(self.questions):
            return self.questions[self.current_index]
        return ""

    def current_question_number(self):
        return self.current_index + 1

    def is_listening(self):
        return self.state == "listening"

    def is_done(self):
        return self.state == "done"

    def state_label(self):
        return self.state.upper()

    def start_histogram(self):
        self.current_histogram = self._blank_histogram()
        self.histogram_total = 0.0

    def accumulate_scores(self, scores, weight):
        if weight <= 0 or not scores:
            weight = 1.0
        for key in self.current_histogram:
            self.current_histogram[key] += scores.get(key, 0.0) * weight
        self.histogram_total += weight

    def finalize_histogram(self):
        if self.histogram_total <= 0:
            return self._blank_histogram()
        return {
            key: value / self.histogram_total
            for key, value in self.current_histogram.items()
        }

    def _blank_histogram(self):
        return {key: 0.0 for key in EMOTION_KEYS}

    def force_finalize(self):
        if self.state == "listening":
            self.state = "report"
            self.state_started_at = time.time()
            return "finalize"
        return None


def preprocess_face_roi(face_roi):
    """Enhance contrast to help downstream emotion models."""
    if face_roi is None or face_roi.size == 0:
        return face_roi

    # Slight upscaling improves small faces.
    h, w = face_roi.shape[:2]
    scale = 1.2
    face_roi = cv2.resize(face_roi, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    lab = cv2.cvtColor(face_roi, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return cv2.GaussianBlur(enhanced, (3, 3), 0)


class EmotionFusionEngine:
    """Fuses DeepFace with optional FER detector for higher precision."""

    def __init__(self):
        self.fer_detector = FER(mtcnn=True) if FER else None

    def analyze(self, face_roi):
        if face_roi is None or face_roi.size == 0:
            return {}

        prepared = preprocess_face_roi(face_roi)
        score_sets = []

        deepface_scores = self._analyze_with_deepface(prepared)
        if deepface_scores:
            score_sets.append(deepface_scores)

        fer_scores = self._analyze_with_fer(prepared)
        if fer_scores:
            score_sets.append(fer_scores)

        if not score_sets:
            return {}

        combined = {key: 0.0 for key in EMOTION_KEYS}
        for scores in score_sets:
            normalized = normalize_emotion_dict(scores)
            for key in EMOTION_KEYS:
                combined[key] += normalized.get(key, 0.0)

        count = len(score_sets)
        return {key: value / count for key, value in combined.items()}

    def _analyze_with_deepface(self, face_roi):
        try:
            result = DeepFace.analyze(
                face_roi,
                actions=['emotion'],
                enforce_detection=False,
                detector_backend='mediapipe',
                prog_bar=False
            )
            if isinstance(result, list):
                result = result[0]
            return result.get('emotion', {})
        except Exception:
            return {}

    def _analyze_with_fer(self, face_roi):
        if not self.fer_detector:
            return {}
        try:
            detections = self.fer_detector.detect_emotions(face_roi)
            if detections:
                return detections[0].get('emotions', {})
        except Exception:
            return {}
        return {}


class ExternalModelBridge:
    """Tracks readiness of ElevenLabs and Gemini integrations."""

    def __init__(self):
        self.elevenlabs_model = None
        self.gemini_model = None
        self.last_prompt = ""

    def attach_elevenlabs(self, model_handle):
        self.elevenlabs_model = model_handle

    def attach_gemini(self, model_handle):
        self.gemini_model = model_handle

    def ready(self):
        return self.elevenlabs_model is not None and self.gemini_model is not None

    def status_label(self):
        if self.ready():
            return "Models: ElevenLabs + Gemini ready"
        if self.elevenlabs_model and not self.gemini_model:
            return "Models: waiting for Gemini"
        if self.gemini_model and not self.elevenlabs_model:
            return "Models: waiting for ElevenLabs"
        return "Models: loading..."

    def store_prompt(self, prompt_text):
        self.last_prompt = prompt_text
        print("\n--- Gemini conversation prompt ---\n")
        print(prompt_text)
        print("\n---------------------------------\n")


class EmotionAwareTravelPlanner:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self.data = self._load_data()
        self.plan = []
        self.prompt = ""

    def _load_data(self):
        if not self.data_path.exists():
            return {}
        with self.data_path.open("r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return {}

    def has_plan(self):
        return len(self.plan) > 0

    def generate_plan(self, conversation_results):
        self.plan = []
        for idx, result in enumerate(conversation_results):
            emotion = result.get("label", "neutral")
            suggestion_pool = self.data.get(emotion, self.data.get("default", []))
            suggestions = suggestion_pool[:2]
            self.plan.append(
                {
                    "question_number": idx + 1,
                    "emotion": emotion,
                    "question": result.get("question", ""),
                    "spectrum": result.get("spectrum", {}),
                    "locations": suggestions,
                }
            )
        self.prompt = self._build_prompt(self.plan)
        return self.plan

    def _build_prompt(self, plan):
        if not plan:
            return ""
        lines = ["Summarize the user's emotional journey and propose tailored travel ideas:"]
        for entry in plan:
            lines.append(
                f"- Q{entry['question_number']} emotion {entry['emotion']}: "
                f"{entry['question']}"
            )
            spectrum = entry.get("spectrum", {})
            if spectrum:
                lines.append(f"    feelings mix: {self._format_spectrum_line(spectrum)}")
            for loc in entry["locations"]:
                lines.append(
                    f"    • {loc['name']} ({loc['region']}, {loc['country']}) – {loc['vibe']}"
                )
        return "\n".join(lines)

    def formatted_summaries(self):
        summaries = []
        for entry in self.plan:
            if not entry["locations"]:
                continue
            primary = entry["locations"][0]
            spectrum = entry.get("spectrum", {})
            mix = self._format_spectrum_line(spectrum)
            if mix:
                mix_text = f" | {mix}"
            else:
                mix_text = ""
            summaries.append(
                f"Q{entry['question_number']} ({entry['emotion']}): {primary['name']} - {primary['vibe']}{mix_text}"
            )
        return summaries

    @staticmethod
    def _format_spectrum_line(spectrum, top=3):
        items = sorted(spectrum.items(), key=lambda kv: kv[1], reverse=True)
        chunks = []
        for emotion, value in items[:top]:
            perc = int(round(value * 100))
            if perc <= 0:
                continue
            chunks.append(f"{emotion} {perc}%")
        return ", ".join(chunks)


class ResponseStreamManager:
    """Provides frames from webcam or mock response videos per question."""

    def __init__(self, default_device=0, mock_paths=None):
        self.default_capture = cv2.VideoCapture(default_device)
        self.current_capture = self.default_capture
        self.mock_paths = mock_paths or []
        self.using_mock = False
        self.current_question = None

    def start_question(self, question_index):
        path = self._mock_path_for(question_index)
        if path and path.exists():
            self._switch_to_mock(path)
        else:
            self._use_default()
        self.current_question = question_index

    def finish_question(self):
        if self.using_mock and self.current_capture and self.current_capture is not self.default_capture:
            self.current_capture.release()
        self._use_default()
        self.current_question = None

    def read(self):
        if not self.current_capture:
            return False, None, False
        ret, frame = self.current_capture.read()
        if not ret and self.using_mock:
            # Mock video finished
            self.finish_question()
            return False, None, True
        return ret, frame, False

    def release(self):
        if self.current_capture and self.current_capture is not self.default_capture:
            self.current_capture.release()
        if self.default_capture:
            self.default_capture.release()

    def _mock_path_for(self, question_index):
        if question_index is None:
            return None
        if 0 <= question_index < len(self.mock_paths):
            return self.mock_paths[question_index]
        return None

    def _switch_to_mock(self, path):
        if self.current_capture and self.current_capture is not self.default_capture:
            self.current_capture.release()
        self.current_capture = cv2.VideoCapture(str(path))
        self.using_mock = True

    def _use_default(self):
        if self.current_capture is None:
            self.current_capture = self.default_capture
        elif self.current_capture is not self.default_capture:
            self.current_capture = self.default_capture
        self.using_mock = False


def maybe_generate_travel_plan(conversation, planner, model_bridge):
    if not model_bridge.ready():
        return
    if planner.has_plan():
        return
    if len(conversation.results) < len(QUESTIONS):
        return
    plan = planner.generate_plan(conversation.results)
    if planner.prompt:
        model_bridge.store_prompt(planner.prompt)
    return plan


def attach_elevenlabs_model(model_handle):
    global external_models
    external_models.attach_elevenlabs(model_handle)


def attach_gemini_model(model_handle):
    global external_models
    external_models.attach_gemini(model_handle)


def spectrum_to_text(spectrum, top=3):
    if not spectrum:
        return ""
    items = sorted(spectrum.items(), key=lambda kv: kv[1], reverse=True)
    chunks = []
    for emotion, value in items[:top]:
        perc = int(round(value * 100))
        if perc <= 0:
            continue
        chunks.append(f"{emotion} {perc}%")
    return ", ".join(chunks)


# Setup
mp_face_mesh = mp.solutions.face_mesh
stream_manager = ResponseStreamManager(default_device=0, mock_paths=MOCK_RESPONSE_VIDEOS)
prev_time = 0
loop_prev_time = 0
smoother = EmotionSmoother(EMOTION_KEYS, window=15)
resolver = ComplexEmotionResolver(COMPLEX_EMOTION_MIXES)
fusion_engine = EmotionFusionEngine()
external_models = ExternalModelBridge()
travel_planner = EmotionAwareTravelPlanner(TRAVEL_DATA_PATH)
conversation = ConversationController(QUESTIONS)
conversation.start()


def finalize_current_answer():
    stream_manager.finish_question()
    averaged_scores = smoother.average()
    if smoother.has_data():
        final_label, final_confidence, _ = resolver.pick_label(averaged_scores)
    else:
        final_label, final_confidence = "unknown", 0.0
    spectrum = conversation.finalize_histogram()
    conversation.record_result(final_label, final_confidence, spectrum)
    maybe_generate_travel_plan(conversation, travel_planner, external_models)

def get_face_contour(face_landmarks, frame_shape):
    """Convert the selected landmarks into pixel positions."""
    h, w, _ = frame_shape
    contour = []
    for idx in FACE_OVAL_LANDMARKS:
        lm = face_landmarks.landmark[idx]
        contour.append((int(lm.x * w), int(lm.y * h)))
    return np.array(contour, dtype=np.int32)


def draw_conversation_overlay(frame, conversation, planner, model_bridge):
    """Render question prompts, state, and per-question results on the frame."""
    base_y = 30
    cv2.putText(
        frame,
        model_bridge.status_label(),
        (20, base_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (200, 200, 200),
        1,
    )
    base_y += 20
    cv2.putText(
        frame,
        f"State: {conversation.state_label()}",
        (20, base_y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
    )

    question = conversation.current_question_text()
    if question:
        wrapped = textwrap.wrap(question, width=40)
        for idx, line in enumerate(wrapped[:3]):
            cv2.putText(
                frame,
                f"Q{conversation.current_question_number()}: {line}",
                (20, base_y + 25 * (idx + 1)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                1,
            )
        offset_lines = len(wrapped[:3])
    else:
        offset_lines = 0

    info_y = base_y + 25 * (offset_lines + 2)
    if conversation.is_listening():
        cv2.putText(
            frame,
            "Listening for the answer...",
            (20, info_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1,
        )
        if conversation.live_label:
            live_text = f"Live: {conversation.live_label}"
            cv2.putText(
                frame,
                live_text,
                (20, info_y + 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                1,
            )
        if conversation.live_blend:
            cv2.putText(
                frame,
                f"Blend hint: {conversation.live_blend}",
                (20, info_y + 50),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (200, 200, 200),
                1,
            )
    elif conversation.state == "report" and conversation.results:
        last = conversation.results[-1]
        message = f"Q{conversation.current_question_number()} result: {last['label']}"
        cv2.putText(
            frame,
            message,
            (20, info_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1,
        )
        spectrum_line = spectrum_to_text(last.get("spectrum", {}))
        if spectrum_line:
            cv2.putText(
                frame,
                f"Spectrum: {spectrum_line}",
                (20, info_y + 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (200, 200, 200),
                1,
            )
    elif conversation.is_done():
        cv2.putText(
            frame,
            "Conversation finished. Press 'q' to exit.",
            (20, info_y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (255, 255, 255),
            1,
        )

    summary_y = frame.shape[0] - 120
    for idx, result in enumerate(conversation.results):
        spectrum_line = spectrum_to_text(result.get("spectrum", {}))
        if spectrum_line:
            text = f"Q{idx + 1}: {result['label']} | {spectrum_line}"
        else:
            text = f"Q{idx + 1}: {result['label']}"
        cv2.putText(
            frame,
            text,
            (20, summary_y + idx * 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (200, 200, 200),
            1,
        )

    if planner and planner.has_plan():
        plan_lines = planner.formatted_summaries()
        for idx, line in enumerate(plan_lines[:3]):
            cv2.putText(
                frame,
                f"Trip: {line}",
                (20, frame.shape[0] - 50 + idx * 18),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                1,
            )

    return frame


with mp_face_mesh.FaceMesh(
    max_num_faces=2,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
) as face_mesh:
    while True:
        state_transition = conversation.update_state()
        finalize_due = False

        if state_transition == "reset":
            smoother.reset()
            conversation.live_label = "waiting"
            conversation.live_confidence = 0.0
            conversation.live_blend = ""
            conversation.start_histogram()
            stream_manager.start_question(conversation.current_index)
        elif state_transition == "finalize":
            finalize_due = True

        ret, frame, mock_finished = stream_manager.read()
        if mock_finished:
            forced = conversation.force_finalize()
            if forced == "finalize":
                finalize_due = True

        if not ret:
            if finalize_due:
                finalize_current_answer()
                finalize_due = False
                continue
            else:
                break

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)

        loop_now = time.time()
        frame_delta = loop_now - loop_prev_time if loop_prev_time else 0.0
        loop_prev_time = loop_now
        if frame_delta <= 0:
            frame_delta = 1 / 30.0

        if results.multi_face_landmarks:
            # For conversation we only need the primary face.
            for face_landmarks in results.multi_face_landmarks[:1]:
                contour = get_face_contour(face_landmarks, frame.shape)
                if contour.size == 0:
                    continue

                x_min = max(np.min(contour[:, 0]) - 10, 0)
                y_min = max(np.min(contour[:, 1]) - 10, 0)
                x_max = min(np.max(contour[:, 0]) + 10, frame.shape[1])
                y_max = min(np.max(contour[:, 1]) + 10, frame.shape[0])

                if conversation.is_listening():
                    face_roi = frame[y_min:y_max, x_min:x_max]
                    if face_roi.size == 0:
                        continue

                    fused_scores = fusion_engine.analyze(face_roi)
                    if fused_scores:
                        normalized_scores = normalize_emotion_dict(fused_scores)
                        smoothed_scores = smoother.update(normalized_scores)
                        conversation.accumulate_scores(normalized_scores, frame_delta)
                        emotion, confidence, complex_scores = resolver.pick_label(smoothed_scores)
                        conversation.live_label = emotion
                        conversation.live_confidence = confidence
                        if complex_scores:
                            blend = max(complex_scores.items(), key=lambda kv: kv[1])
                            conversation.live_blend = blend[0]
                        else:
                            conversation.live_blend = ""
                    else:
                        conversation.live_label = "unknown"
                        conversation.live_confidence = 0.0
                        conversation.live_blend = ""

                mesh_color = (255, 255, 255)
                mesh_spacing = 15

                # Build a mask for the face contour so the mesh follows the exact shape.
                mask = np.zeros(frame.shape[:2], dtype=np.uint8)
                cv2.fillPoly(mask, [contour], 255)

                mesh_overlay = np.zeros_like(frame)
                for y in range(y_min, y_max, mesh_spacing):
                    cv2.line(mesh_overlay, (x_min, y), (x_max, y), mesh_color, 1)
                for x in range(x_min, x_max, mesh_spacing):
                    cv2.line(mesh_overlay, (x, y_min), (x, y_max), mesh_color, 1)
                mesh_overlay = cv2.bitwise_and(mesh_overlay, mesh_overlay, mask=mask)

                # Draw the outline to emphasize the contour and blend the mesh on top.
                cv2.polylines(mesh_overlay, [contour], True, mesh_color, 2)
                frame = cv2.addWeighted(frame, 1.0, mesh_overlay, 0.7, 0)

                if conversation.is_listening() and conversation.live_label:
                    text_pos = (x_min, max(y_min - 15, 20))
                    cv2.putText(frame, conversation.live_label, text_pos, cv2.FONT_HERSHEY_SIMPLEX, 0.8, mesh_color, 2)

                    if conversation.live_blend:
                        cv2.putText(
                            frame,
                            f"blend: {conversation.live_blend}",
                            (x_min, min(y_max + 20, frame.shape[0] - 10)),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.6,
                            mesh_color,
                            1
                        )

        curr_time = time.time()
        fps = 1 / (curr_time - prev_time) if prev_time else 0
        prev_time = curr_time
        fps_text = f'FPS: {int(fps)}'
        cv2.putText(
            frame,
            fps_text,
            (frame.shape[1] - 180, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2
        )

        frame = draw_conversation_overlay(frame, conversation, travel_planner, external_models)

        cv2.imshow("Emotion Scan Visualizer", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

        if finalize_due:
            finalize_current_answer()

stream_manager.release()
cv2.destroyAllWindows()
