"""Utilities for synthesizing and serving prompt audio."""

from __future__ import annotations

import uuid
from pathlib import Path

from elabs1 import send_text_to_elevenlabs

AUDIO_CACHE = Path("project/audio_cache")


def synthesize_prompt_audio(text: str) -> Path:
    AUDIO_CACHE.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.mp3"
    destination = AUDIO_CACHE / filename
    send_text_to_elevenlabs(text, playback=False, save_to=destination)
    return destination
