import os
from typing import Optional, Sequence, Tuple

from dotenv import load_dotenv
from prompts import STAGE_INSTRUCTIONS, SYSTEM_PROMPT

try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover - optional dependency
    genai = None

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash-lite-preview")

class GeminiNotConfiguredError(RuntimeError):
    """Raised when the Gemini client cannot be initialized."""


def _ensure_model() -> "genai.GenerativeModel":
    # Lazily configure the shared Gemini model so we only do API setup when a prompt is sent.
    if genai is None:
        raise GeminiNotConfiguredError(
            "The google-generativeai package is required. Install it with `pip install google-generativeai`."
        )
    if not GEMINI_API_KEY:
        raise GeminiNotConfiguredError("Set GEMINI_API_KEY (or GOOGLE_API_KEY) in your environment/.env file.")

    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(GEMINI_MODEL)


def get_trip_response(
    user_text: str,
    *,
    stress_hint: Optional[str] = None,
    history: Optional[Sequence[Tuple[str, str]]] = None,
    stage_instruction: str = "follow_up_question",
) -> str:
    """
    Send the user's transcript to Gemini and return a wellness-oriented travel suggestion.
    """
    model = _ensure_model()

    # Prompt priming keeps Gemini focused on the mental-wellbeing travel concierge persona.
    persona = SYSTEM_PROMPT
    history_block = _history_to_text(history)
    stage_hint = STAGE_INSTRUCTIONS.get(stage_instruction, STAGE_INSTRUCTIONS["follow_up_question"])

    prompt_sections = [persona]
    if history_block:
        prompt_sections.append(f"Conversation so far:\n{history_block}")
    prompt_sections.append(f"Latest user message:\n{user_text.strip()}")
    prompt_sections.append(f"Stage instructions:\n{stage_hint}")
    if stress_hint:
        prompt_sections.append(f"Stress indicators: {stress_hint.strip()}")

    prompt = "\n\n".join(prompt_sections)

    response = model.generate_content(prompt)
    text = _extract_text(response)
    if not text:
        raise RuntimeError("Gemini returned an empty response.")
    return text.strip()


def _extract_text(response: "genai.types.GenerateContentResponse") -> str:
    # The SDK can place text on response.text or within candidate/part structures; normalize it here.
    if hasattr(response, "text") and response.text:
        return response.text

    candidates = getattr(response, "candidates", None)
    if candidates:
        for candidate in candidates:
            parts = getattr(candidate, "content", None)
            if parts and getattr(parts, "parts", None):
                fragments = [getattr(part, "text", "") for part in parts.parts if getattr(part, "text", "")]
                if fragments:
                    return "\n".join(fragments)
            if getattr(candidate, "content", None) and getattr(candidate.content, "text", None):
                return candidate.content.text

    return ""


def _history_to_text(history: Optional[Sequence[Tuple[str, str]]]) -> str:
    if not history:
        return ""
    lines = [f"{role.upper()}: {text.strip()}" for role, text in history if text.strip()]
    return "\n".join(lines)
