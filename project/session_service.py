"""Reusable session orchestration helpers for the emotion workflow."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Any

from camera import EmotionVisualizer
from elabs1 import log_conversation, record_audio, transcribe_audio
from session_config import LISTEN_SECONDS, QUESTIONS, UI_WINDOW_NAME, WARMUP_SECONDS
from audio_service import synthesize_prompt_audio

from actions.question import run_question
from actions.utils import speak_with_visualizer

ANSWERS_LOG = Path("project/latest_answers.json")

SessionEventHook = Callable[[str, Dict[str, object]], None]


def _default_hook(event_type: str, payload: Dict[str, object]) -> None:  # pragma: no cover
    """Fallback no-op hook."""


@dataclass
class SessionService:
    """Wraps the session flow so it can be reused outside the CLI."""

    on_event: SessionEventHook = _default_hook
    visualizer: EmotionVisualizer = field(default_factory=EmotionVisualizer)
    history: List[Tuple[str, str]] = field(default_factory=list)
    results: List[Dict[str, object]] = field(default_factory=list)

    def emit(self, event_type: str, **payload: object) -> None:
        try:
            self.on_event(event_type, payload)
        except Exception:  # noqa: BLE001 - hooks should not break the flow
            pass

    def record_assistant_line(self, text: str) -> None:
        log_conversation("assistant", text)
        self.history.append(("assistant", text))
        self.emit("assistant_line", text=text)

    def speak_line(self, text: str) -> None:
        audio_url = None
        try:
            audio_path = synthesize_prompt_audio(text)
            audio_url = f"/audio/prompts/{audio_path.name}"
        except Exception as exc:  # noqa: BLE001
            self.emit("audio_error", text=text, message=str(exc))
        speak_with_visualizer(text, self.visualizer, window_name=UI_WINDOW_NAME)
        self.emit("spoken_line", text=text, audio=audio_url)

    def ask_question(
        self,
        question_text: str,
        *,
        listen_seconds: float = LISTEN_SECONDS,
        warmup_seconds: float = WARMUP_SECONDS,
        question_index: int,
        audio_bytes: Optional[bytes] = None,
    ) -> Dict[str, object]:
        self.emit(
            "question_start",
            question=question_text,
            listen_seconds=listen_seconds,
            warmup_seconds=warmup_seconds,
            index=question_index,
        )
        if audio_bytes is not None:
            transcript = transcribe_audio(audio_bytes)
            entry = {
                "question": question_text,
                "transcript": transcript,
                "spectrum": {},
                "dominant": "neutral",
            }
            log_conversation("user", transcript)
            self.history.append(("user", transcript))
        else:
            entry = run_question(
                question_text,
                listen_seconds=listen_seconds,
                warmup_seconds=warmup_seconds,
                visualizer=self.visualizer,
                window_name=UI_WINDOW_NAME,
                question_index=question_index,
                history=self.history,
            )
        self.results.append(entry)
        self.emit("question_complete", index=question_index, entry=entry)
        return entry

    def save_results(self, destination: Path = ANSWERS_LOG) -> Path:
        destination.parent.mkdir(parents=True, exist_ok=True)
        payload = []
        for idx, entry in enumerate(self.results, start=1):
            payload.append(
                {
                    "question": entry.get("question", f"Q{idx}"),
                    "transcript": entry.get("transcript") or "[no transcript]",
                    "dominant_emotion": entry.get("dominant", "neutral"),
                }
            )
        destination.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        self.emit("results_saved", path=str(destination))
        return destination

    def close(self) -> None:
        self.emit("session_closed")
        self.visualizer.release()

    def __enter__(self) -> "SessionService":
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        self.close()
