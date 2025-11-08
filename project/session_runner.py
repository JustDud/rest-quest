"""Background runner for the interactive session so it can be triggered via API."""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from session import run_session

LATEST_RESULTS = Path("project/latest_answers.json")

_session_thread: Optional[threading.Thread] = None
_status_lock = threading.Lock()
_status: Dict[str, Any] = {
    "state": "idle",
    "message": "Ready for a new session",
    "started_at": None,
    "finished_at": None,
}


def _update_status(**kwargs: Any) -> None:
    with _status_lock:
        _status.update(kwargs)


def _load_latest_answers() -> list[dict[str, Any]]:
    if not LATEST_RESULTS.exists():
        return []
    try:
        return json.loads(LATEST_RESULTS.read_text(encoding="utf-8"))
    except Exception:
        return []


def start_session() -> None:
    """Kick off the full session in a background thread."""
    global _session_thread
    if _session_thread and _session_thread.is_alive():
        raise RuntimeError("Session already running")

    def _runner() -> None:
        try:
            _update_status(
                state="running",
                message="Session in progress",
                started_at=datetime.now(timezone.utc).isoformat(),
                finished_at=None,
            )
            run_session()
            _update_status(
                state="completed",
                message="Session completed",
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        except Exception as exc:  # noqa: BLE001
            _update_status(
                state="error",
                message=str(exc),
                finished_at=datetime.now(timezone.utc).isoformat(),
            )
        finally:
            global _session_thread
            _session_thread = None

    _session_thread = threading.Thread(target=_runner, daemon=True)
    _session_thread.start()


def get_session_status() -> Dict[str, Any]:
    with _status_lock:
        payload = dict(_status)
    payload["latestAnswers"] = _load_latest_answers()
    payload["running"] = _session_thread is not None and _session_thread.is_alive()
    return payload
