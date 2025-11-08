"""Shared helpers for per-action modules."""

from __future__ import annotations

import threading
import time

from elabs1 import send_text_to_elevenlabs
from camera import EmotionVisualizer, cv2

try:  # optional dependency used only for model warmup
    import numpy as np
except Exception:  # pragma: no cover - optional
    np = None  # type: ignore


def speak_with_visualizer(
    text: str,
    visualizer: EmotionVisualizer,
    *,
    window_name: str,
    timeout: float = 30.0,
) -> None:
    """Speak text via ElevenLabs while keeping the OpenCV window responsive."""
    done = threading.Event()

    def _worker() -> None:
        try:
            send_text_to_elevenlabs(text, playback=True)
        except Exception as exc:  # noqa: BLE001
            print(f"[warn] TTS failed: {exc}")
        finally:
            done.set()

    threading.Thread(target=_worker, daemon=True).start()

    start = time.time()
    while not done.is_set() and (time.time() - start) < timeout:
        try:
            frame, _ = visualizer.process_frame()
            cv2.imshow(window_name, frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
        except Exception:
            time.sleep(0.02)

    done.wait(timeout=0.1)


def preload_analyzer(visualizer: EmotionVisualizer, *, window_name: str, timeout: float = 3.0) -> None:
    """Give the background analyzer a head start to avoid first-call latency."""
    analyzer = getattr(visualizer, "analyzer", None)
    if analyzer is None or np is None:
        return

    try:
        dummy = (np.ones((224, 224, 3), dtype=np.uint8) * 127)
        analyzer.submit(dummy)
    except Exception:
        return

    start = time.time()
    while (time.time() - start) < timeout and getattr(analyzer, "last_scores", None) is None:
        try:
            frame, _ = visualizer.process_frame()
            cv2.imshow(window_name, frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
        except Exception:
            time.sleep(0.02)
