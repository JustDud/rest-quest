"""High-level orchestration for the emotion-based questionnaire."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List, Tuple

from camera import EmotionVisualizer, cv2, DeepFace, FER, format_spectrum
from elabs1 import log_conversation
from gemini_client1 import get_trip_response
from session_config import LISTEN_SECONDS, QUESTIONS, UI_WINDOW_NAME, WARMUP_SECONDS

from actions.question import run_question
from actions.utils import speak_with_visualizer

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


def _speak_line(text: str, *, visualizer: EmotionVisualizer) -> None:
    speak_with_visualizer(text, visualizer, window_name=UI_WINDOW_NAME)


def _record_assistant_line(text: str, history: List[Tuple[str, str]]) -> None:
    log_conversation("assistant", text)
    history.append(("assistant", text))


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


def _save_transcripts(results: List[dict], *, destination: Path = ANSWERS_LOG) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    payload = []
    for idx, entry in enumerate(results, start=1):
        payload.append(
            {
                "question": entry.get("question", f"Q{idx}"),
                "transcript": entry.get("transcript") or "[no transcript]",
                "dominant_emotion": entry.get("dominant", "neutral"),
            }
        )
    destination.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return destination


def run_session() -> None:
    """Run the full questionnaire workflow using the live camera feed."""
    _ensure_dependencies()

    visualizer = EmotionVisualizer()
    session_results: List[dict] = []
    history: List[Tuple[str, str]] = []
    try:
        if not QUESTIONS:
            raise RuntimeError("At least one question prompt is required.")

        first_question = QUESTIONS[0]
        _record_assistant_line(first_question, history)
        _speak_line(first_question, visualizer=visualizer)

        entry = run_question(
            first_question,
            listen_seconds=LISTEN_SECONDS,
            warmup_seconds=WARMUP_SECONDS,
            visualizer=visualizer,
            window_name=UI_WINDOW_NAME,
            question_index=1,
            history=history,
        )
        session_results.append(entry)

        follow_up_question = _generate_followup_question(history)
        _record_assistant_line(follow_up_question, history)
        _speak_line(follow_up_question, visualizer=visualizer)

        entry = run_question(
            follow_up_question,
            listen_seconds=LISTEN_SECONDS,
            warmup_seconds=WARMUP_SECONDS,
            visualizer=visualizer,
            window_name=UI_WINDOW_NAME,
            question_index=2,
            history=history,
        )
        session_results.append(entry)

        closing = "Thanks for your responses"
        _record_assistant_line(closing, history)
        _speak_line(closing, visualizer=visualizer)

        _print_analytics(session_results)
        saved_path = _save_transcripts(session_results)
        print(f"Saved transcribed answers to {saved_path}")

    finally:
        visualizer.release()
