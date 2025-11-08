"""Question action: ask, record, and aggregate emotions."""

from __future__ import annotations

import threading
from typing import Dict, List, Tuple

from camera import (
    EmotionAggregator,
    EmotionVisualizer,
    append_emotion_log,
    collect_emotions_until_event,
    format_spectrum,
    warmup_detection,
)
from elabs1 import log_conversation, record_audio, transcribe_audio


def _capture_audio_async(duration_seconds: float) -> tuple[threading.Event, Dict[str, bytes]]:
    done = threading.Event()
    payload: Dict[str, bytes] = {}

    def _worker() -> None:
        try:
            payload["audio"] = record_audio(duration_seconds=duration_seconds, countdown=False)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] Audio capture failed: {exc}")
            payload["audio"] = b""
        finally:
            done.set()

    threading.Thread(target=_worker, daemon=True).start()
    return done, payload


def run_question(
    question_text: str,
    *,
    listen_seconds: float,
    warmup_seconds: float,
    visualizer: EmotionVisualizer,
    window_name: str,
    question_index: int,
    history: List[Tuple[str, str]],
) -> Dict[str, object]:
    print(f"\nQuestion {question_index}: {question_text}")

    aggregator = EmotionAggregator()
    print("Warming up emotion detector...")
    warmup_detection(visualizer, aggregator, seconds=warmup_seconds)
    aggregator.reset()

    stop_event, audio_payload = _capture_audio_async(listen_seconds)
    visualizer.is_listening = True
    try:
        collect_emotions_until_event(
            visualizer,
            aggregator,
            stop_event,
            max_seconds=listen_seconds,
            window_name=window_name,
        )
    finally:
        visualizer.is_listening = False

    stop_event.wait()
    audio_bytes = audio_payload.get("audio", b"")

    transcript = ""
    if audio_bytes:
        try:
            transcript = transcribe_audio(audio_bytes)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] Transcription failed: {exc}")
    else:
        print("[warn] No audio captured for this question.")

    user_text = transcript or "[no transcript]"
    log_conversation("user", user_text)
    if transcript:
        history.append(("user", transcript))

    spectrum = aggregator.summary()
    dominant = aggregator.dominant()
    entry: Dict[str, object] = {
        "question": question_text,
        "transcript": transcript,
        "spectrum": spectrum,
        "dominant": dominant,
    }
    append_emotion_log(entry)

    print(f"Detected emotions: {format_spectrum(spectrum)}")
    print("Recording finished.\n")

    return entry
