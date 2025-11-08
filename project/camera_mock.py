import time
import random
from datetime import datetime
from pathlib import Path
import json

import cv2

QUESTIONS = [
    "How are you feeling today?",
    "What's something that made you smile recently?",
]
EMOTIONS = ["angry", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
EMOTION_LOG = Path("project/emotion_results.jsonl")


def append_emotion_log(entry: dict) -> None:
    EMOTION_LOG.parent.mkdir(parents=True, exist_ok=True)
    payload = {"timestamp": datetime.utcnow().isoformat(), **entry}
    with EMOTION_LOG.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def format_spectrum(spectrum: dict, top: int = 3) -> str:
    items = sorted(spectrum.items(), key=lambda kv: kv[1], reverse=True)
    chunks = []
    for emotion, value in items[:top]:
        percent = int(round(value * 100))
        if percent <= 0:
            continue
        chunks.append(f"{emotion} {percent}%")
    return ", ".join(chunks) if chunks else "neutral 100%"


def mock_spectrum() -> dict:
    # create a random probability distribution over EMOTIONS
    values = [random.random() for _ in EMOTIONS]
    s = sum(values)
    return {k: v / s for k, v in zip(EMOTIONS, values)}


def run_mock_session(camera_index: int = 0, listen_seconds: int = 10) -> None:
    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        raise RuntimeError("Unable to open the camera.")

    try:
        for idx, question in enumerate(QUESTIONS, start=1):
            print(f"\nQuestion {idx}: {question}")
            start = time.time()
            spectrum = {e: 0.0 for e in EMOTIONS}
            # rotate labels every 0.7s and aggregate into a simple time-weighted average
            last = time.time()
            while time.time() - start < listen_seconds:
                ret, frame = cap.read()
                if not ret:
                    break
                frame = cv2.flip(frame, 1)

                if time.time() - last > 0.7:
                    new = mock_spectrum()
                    # simple moving average (weight recent more)
                    for k in spectrum:
                        spectrum[k] = spectrum[k] * 0.6 + new[k] * 0.4
                    last = time.time()

                dominant = max(spectrum, key=spectrum.get)
                label_text = (dominant or "neutral").upper()
                cv2.putText(frame, label_text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2)

                cv2.imshow("Emotion Tracker (mock)", frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    print("Session aborted by user.")
                    return

            transcript = "[mock transcript]"
            entry = {
                "question": question,
                "transcript": transcript,
                "spectrum": spectrum,
                "dominant": max(spectrum, key=spectrum.get),
            }
            append_emotion_log(entry)

            print(f"Detected emotions: {format_spectrum(spectrum)}")
            print("Recording finished.\n")

        print("Mock session complete.")
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    try:
        run_mock_session()
    except KeyboardInterrupt:
        print("\nSession aborted by user.")
