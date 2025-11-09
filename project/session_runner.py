"""Background runner for the interactive session so it can be triggered via API."""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
from queue import Queue, Empty

from .session import run_session
from session_service import SessionEventHook

LATEST_RESULTS = Path("project/latest_answers.json")

_session_thread: Optional[threading.Thread] = None
_status_lock = threading.Lock()
_status: Dict[str, Any] = {
    "state": "idle",
    "message": "Ready for a new session",
    "started_at": None,
    "finished_at": None,
}
_audio_queue: Queue[bytes] = Queue()


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


class SessionEventBus:
    def __init__(self) -> None:
        self._subscribers: list[Queue] = []
        self._lock = threading.Lock()

    def publish(self, event_type: str, payload: Dict[str, object]) -> None:
        event = {
            "type": event_type,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        with self._lock:
            subscribers = list(self._subscribers)
        for subscriber in subscribers:
            try:
                subscriber.put(event, block=False)
            except Exception:
                self.unsubscribe(subscriber)

    def subscribe(self) -> Queue:
        queue: Queue = Queue()
        with self._lock:
            self._subscribers.append(queue)
        return queue

    def unsubscribe(self, queue: Queue) -> None:
        with self._lock:
            if queue in self._subscribers:
                self._subscribers.remove(queue)


_event_bus = SessionEventBus()


def publish_event(event_type: str, payload: Dict[str, object]) -> None:
    _event_bus.publish(event_type, payload)


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
            run_session(on_event=publish_event, audio_fetcher=await_audio_chunk)
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


def subscribe_events() -> Queue:
    return _event_bus.subscribe()


def unsubscribe_events(queue: Queue) -> None:
    _event_bus.unsubscribe(queue)


def submit_audio_chunk(data: bytes) -> None:
    _audio_queue.put(data)


def await_audio_chunk(timeout: Optional[float] = None) -> Optional[bytes]:
    try:
        return _audio_queue.get(timeout=timeout)
    except Empty:
        return None
