"""Final summary action: Gemini call plus spoken wrap-up."""

from __future__ import annotations

from typing import Iterable, Mapping

from camera import EMOTION_KEYS, EmotionVisualizer, format_spectrum
from elabs1 import log_conversation
from gemini_client1 import get_trip_response

from .utils import speak_with_visualizer

CLOSING_TEXT = "Thanks — that's all. I've saved a short summary on the terminal."


def run_summary(
    session_results: Iterable[Mapping[str, object]],
    *,
    questions: list[str],
    visualizer: EmotionVisualizer,
    window_name: str,
) -> None:
    results = list(session_results)
    if not results:
        print("No responses were captured.")
        return

    prompt_lines = []
    for idx, result in enumerate(results, start=1):
        question = questions[idx - 1] if idx - 1 < len(questions) else result.get("question", f"Q{idx}")
        transcript = result.get("transcript") or "[no transcript]"
        spectrum = result.get("spectrum") or {}
        prompt_lines.append(f"Q{idx}: {question}")
        prompt_lines.append(f"User said: {transcript}")
        prompt_lines.append(f"Emotion mix: {format_spectrum(spectrum)}")
        prompt_lines.append("")

    prompt = "\n".join(prompt_lines)
    print("Preparing Gemini summary...")

    try:
        instruction = (
            "Please provide short travel recommendations based on the user's emotional summaries below. "
            "Do not ask any follow-up questions; respond only with concise suggestions."
        )
        gemini_reply = get_trip_response(instruction + "\n\n" + prompt)
        log_conversation("assistant", gemini_reply)
        print("\nGemini response (printed, not spoken):\n", gemini_reply)
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] Gemini response failed: {exc}")

    combined = {k: 0.0 for k in EMOTION_KEYS}
    for result in results:
        spectrum = result.get("spectrum", {})
        for key in EMOTION_KEYS:
            combined[key] += float(spectrum.get(key, 0.0))

    count = len(results) or 1
    combined = {k: v / count for k, v in combined.items()}

    summary_lines = ["Session emotion analytics:"]
    for idx, result in enumerate(results, start=1):
        summary_lines.append(
            f"Q{idx}: {format_spectrum(result.get('spectrum', {}))} (dominant: {result.get('dominant', 'neutral')})"
        )
    summary_lines.append(f"Overall: {format_spectrum(combined)}")
    print("\n" + "\n".join(summary_lines))

    speak_with_visualizer(CLOSING_TEXT, visualizer, window_name=window_name)
