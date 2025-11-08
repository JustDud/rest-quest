"""Session intro action."""

from __future__ import annotations

from camera import EmotionVisualizer

from .utils import preload_analyzer, speak_with_visualizer

INTRO_TEXT = "Hi — I will ask two short questions about how you're feeling. Please answer when prompted."


def run_intro(visualizer: EmotionVisualizer, *, window_name: str) -> None:
    """Warm up the video pipeline and play the greeting."""
    preload_analyzer(visualizer, window_name=window_name)
    speak_with_visualizer(INTRO_TEXT, visualizer, window_name=window_name)
