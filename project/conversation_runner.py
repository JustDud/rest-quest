"""Background helper to run the ElevenLabs conversation loop."""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from .elabs1 import run_conversation

_conversation_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()
_status_lock = threading.Lock()
_status: Dict[str, Any] = {
    "state": "idle",
    "message": "Ready for a new live conversation",
    "started_at": None,
    "finished_at": None,
    "transcript_path": None,
}


def request_stop() -> None:
    _stop_event.set()


def _update_status(**kwargs: Any) -> None:
    with _status_lock:
        _status.update(kwargs)


def _running() -> bool:
    return _conversation_thread is not None and _conversation_thread.is_alive()


def start_conversation(*, turns: int = 2) -> None:
    """Kick off run_conversation in a background thread."""
    global _conversation_thread
    if _running():
        raise RuntimeError("Live conversation already running")
    _stop_event.clear()

    def _runner() -> None:
        try:
            _update_status(
                state="running",
                message="Live conversation in progress",
                started_at=datetime.now(timezone.utc).isoformat(),
                finished_at=None,
            )
            transcript_path = run_conversation(turns=turns, stop_event=_stop_event)
            resolved = Path(transcript_path).resolve()
            _update_status(
                state="completed",
                message="Live conversation finished",
                finished_at=datetime.now(timezone.utc).isoformat(),
                transcript_path=str(resolved),
            )
        except Exception as exc:  # noqa: BLE001
            _update_status(
                state="error",
                message=str(exc),
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        finally:
            global _conversation_thread
            _conversation_thread = None

    _conversation_thread = threading.Thread(target=_runner, daemon=True)
    _conversation_thread.start()


def get_conversation_status() -> Dict[str, Any]:
    with _status_lock:
        payload = dict(_status)
    payload["running"] = _running()
    return payload
