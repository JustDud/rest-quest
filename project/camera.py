
import sys
import cv2
import mediapipe as mp

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

            # Mirror so user sees themselves
            frame = cv2.flip(frame, 1)
            # Convert BGR to RGB for MediaPipe
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_detector.process(rgb)

            if results.detections:
                for det in results.detections:
                    mp_draw.draw_detection(frame, det)

            cv2.imshow("Face Detection (press 'q' to quit)", frame)
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