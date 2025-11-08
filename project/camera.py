import sys
import cv2
import mediapipe as mp
from deepface import DeepFace

def main(camera_index: int = 0, min_detection_confidence: float = 0.5):
    mp_face = mp.solutions.face_detection
    mp_draw = mp.solutions.drawing_utils

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        print("Cannot open camera", camera_index)
        return

    with mp_face.FaceDetection(min_detection_confidence=min_detection_confidence) as face_detector:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to read frame from camera")
                break

            # Mirroring
            frame = cv2.flip(frame, 1)
            
            # Convert BGR to RGB for MediaPipe
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_detector.process(rgb)

            if results.detections:
                for det in results.detections:
                    bboxC = det.location_data.relative_bounding_box
                    h, w, _ = frame.shape
                    x1 = int(bboxC.xmin * w)
                    y1 = int(bboxC.ymin * h)
                    x2 = x1 + int(bboxC.width * w)
                    y2 = y1 + int(bboxC.height * h)

                    # Crop the face region safely
                    face_roi = frame[max(0, y1):y2, max(0, x1):x2]

                    if face_roi.size > 0:
                        try:
                            # Analyze emotion with DeepFace
                            result = DeepFace.analyze(face_roi, actions=['emotion'], enforce_detection=False)
                            emotion = result[0]['dominant_emotion']
                            # Draw rectangle and emotion label
                            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                            cv2.putText(frame, emotion, (x1, y1 - 10),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2, cv2.LINE_AA)
                        except Exception as e:
                            print("Emotion detection error:", e)
                            pass
                    else:
                        cv2.putText(frame, "No Face Detected", (50, 50),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 0, 255), 2, cv2.LINE_AA)

            cv2.imshow("Emotion Detection (press 'q' to quit)", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    idx = 0
    conf = 0.5
    if len(sys.argv) > 1:
        try:
            idx = int(sys.argv[1])
        except Exception:
            pass
    if len(sys.argv) > 2:
        try:
            conf = float(sys.argv[2])
        except Exception:
            pass
    main(camera_index=idx, min_detection_confidence=conf)