"""High-level orchestration for the emotion-based questionnaire."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple, Optional, Callable

import sys

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

from camera import cv2, DeepFace, FER, format_spectrum
from session_service import SessionService, _default_hook
from gemini_client1 import get_trip_response
from session_config import LISTEN_SECONDS, QUESTIONS, UI_WINDOW_NAME, WARMUP_SECONDS

ANSWERS_LOG = Path("project/latest_answers.json")


def _ensure_dependencies() -> None:
    missing = []
    if cv2 is None:
        missing.append("cv2")
    if DeepFace is None and FER is None:
        missing.append("deepface/fer")
    if missing:
        raise RuntimeError(
            "Missing required dependencies: " + ", ".join(missing) + ". "
            "Install the packages or run in mock mode."
        )


def _generate_followup_question(history: List[Tuple[str, str]]) -> str:
    instruction = (
        "Provide exactly one short follow-up question (max 25 words) based on the user's most recent response. "
        "Answer with the question only."
    )
    try:
        question = get_trip_response(
            instruction,
            history=history,
            stage_instruction="follow_up_question",
        )
        question = question.strip()
        if question:
            return question
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] Failed to generate follow-up question: {exc}")
    return "Could you share one detail that would make that trip feel just right?"


def _print_analytics(results: List[dict]) -> None:
    if not results:
        return
    print("\nEmotion analytics per question:")
    for idx, entry in enumerate(results, start=1):
        question = entry.get("question", f"Q{idx}")
        transcript = entry.get("transcript") or "[no transcript]"
        spectrum = entry.get("spectrum", {})
        dominant = entry.get("dominant", "neutral")
        print(f"\nQ{idx}: {question}")
        print(f"  Transcript: {transcript}")
        print(f"  Emotions: {format_spectrum(spectrum)} (dominant: {dominant})")


def run_session(*, on_event=None, audio_fetcher: Optional[Callable[[float], Optional[bytes]]] = None) -> dict:
    """Run the full questionnaire workflow using the live camera feed."""
    _ensure_dependencies()

    handler = on_event if callable(on_event) else _default_hook

    with SessionService(on_event=handler) as service:
        session_results: List[dict] = []
        history = service.history
        if not QUESTIONS:
            raise RuntimeError("At least one question prompt is required.")

        first_question = QUESTIONS[0]
        service.record_assistant_line(first_question)
        service.speak_line(first_question)

        audio_bytes = None
        if audio_fetcher:
            service.emit("record_prompt", question=first_question, index=1)
            audio_bytes = audio_fetcher(LISTEN_SECONDS + WARMUP_SECONDS + 2.0)
            if audio_bytes is None:
                service.emit("record_timeout", index=1)

        entry = service.ask_question(
            first_question,
            listen_seconds=LISTEN_SECONDS,
            warmup_seconds=WARMUP_SECONDS,
            question_index=1,
            audio_bytes=audio_bytes,
        )
        session_results.append(entry)

        follow_up_question = _generate_followup_question(history)
        service.record_assistant_line(follow_up_question)
        service.speak_line(follow_up_question)
        audio_bytes = None
        if audio_fetcher:
            service.emit("record_prompt", question=follow_up_question, index=2)
            audio_bytes = audio_fetcher(LISTEN_SECONDS + WARMUP_SECONDS + 2.0)
            if audio_bytes is None:
                service.emit("record_timeout", index=2)

        entry = service.ask_question(
            follow_up_question,
            listen_seconds=LISTEN_SECONDS,
            warmup_seconds=WARMUP_SECONDS,
            question_index=2,
            audio_bytes=audio_bytes,
        )
        session_results.append(entry)

        closing = "Thanks for your responses"
        service.record_assistant_line(closing)
        service.speak_line(closing)

        _print_analytics(session_results)
        saved_path = service.save_results(destination=ANSWERS_LOG)
        print(f"Saved transcribed answers to {saved_path}")
        return {"results": session_results, "answers_path": str(saved_path)}
