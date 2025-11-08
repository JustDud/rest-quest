import os
from typing import Optional

from dotenv import load_dotenv

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
    if genai is None:
        raise GeminiNotConfiguredError(
            "The google-generativeai package is required. Install it with `pip install google-generativeai`."
        )
    if not GEMINI_API_KEY:
        raise GeminiNotConfiguredError("Set GEMINI_API_KEY (or GOOGLE_API_KEY) in your environment/.env file.")

    genai.configure(api_key=GEMINI_API_KEY)
    return genai.GenerativeModel(GEMINI_MODEL)


def get_trip_response(user_text: str, *, stress_hint: Optional[str] = None) -> str:
    """
    Send the user's transcript to Gemini and return a wellness-oriented travel suggestion.
    """
    model = _ensure_model()

    persona = (
        "You are a friendly mindfulness-focused travel assistant. "
        "Ask concise follow-up questions when needed, recommend destinations that match the user's emotional state, "
        "and weave in gentle wellbeing practices."
    )
    prompt = f"{persona}\n\nUser intention:\n{user_text.strip()}"
    if stress_hint:
        prompt += f"\n\nStress indicators: {stress_hint.strip()}"

    response = model.generate_content(prompt)
    text = _extract_text(response)
    if not text:
        raise RuntimeError("Gemini returned an empty response.")
    return text.strip()


def _extract_text(response: "genai.types.GenerateContentResponse") -> str:
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
