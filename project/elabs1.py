import io
import os
import time
import wave
from datetime import UTC, datetime
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

from dotenv import load_dotenv
from elevenlabs import stream as play_stream
from elevenlabs.client import ElevenLabs
from elevenlabs.core import ApiError
from elevenlabs.text_to_speech.types import TextToSpeechStreamRequestOutputFormat
from elevenlabs.types import (
    MultichannelSpeechToTextResponseModel,
    SpeechToTextChunkResponseModel,
    SpeechToTextWebhookResponseModel,
)
from gemini_client1 import get_trip_response
from prompts import INTRO_PROMPT

try:
    import sounddevice as sd
    import numpy as np
except ImportError:  # pragma: no cover - optional dependency for live capture
    sd = None
    np = None

load_dotenv()

DEFAULT_STT_MODEL = "scribe_v1"
DEFAULT_TTS_MODEL = "eleven_turbo_v2_5"
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel
DEFAULT_STREAM_FORMAT: TextToSpeechStreamRequestOutputFormat = "mp3_44100_128"
LISTEN_SAMPLE_RATE = 16_000
LISTEN_CHANNELS = 1
CONVERSATION_LOG = Path("conversation_log.txt")
SESSION_TRANSCRIPT = Path("latest_transcript.txt")
def _resolve_api_key() -> str:
    api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("ELEVEN_LABS_API_KEY")
    if not api_key:
        raise RuntimeError("Set ELEVENLABS_API_KEY in your environment or .env file.")
    return api_key


elevenlabs = ElevenLabs(api_key=_resolve_api_key())


def _ensure_audio_dependencies() -> None:
    if sd is None or np is None:
        raise RuntimeError(
            "Microphone capture requires the optional 'sounddevice' and 'numpy' dependencies. "
            "Install them with `pip install sounddevice numpy` and ensure PortAudio is available."
        )


def record_audio(
    *,
    duration_seconds: Optional[float] = 6.0,
    sample_rate: int = LISTEN_SAMPLE_RATE,
    channels: int = LISTEN_CHANNELS,
    countdown: bool = True,
    data: Optional[bytes] = None,
) -> bytes:
    """
    Record audio from the system microphone and return WAV bytes.
    """
    if data is not None:
        return data

    _ensure_audio_dependencies()

    if countdown:
        for remaining in range(3, 0, -1):
            print(f"Listening in {remaining}...", flush=True)
            time.sleep(1)
        print("Listening now - speak clearly!", flush=True)

    frames = int(duration_seconds * sample_rate) if duration_seconds else sample_rate * 6
    recording = sd.rec(frames, samplerate=sample_rate, channels=channels, dtype="int16")
    sd.wait()

    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)  # 16-bit PCM
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(recording.tobytes())

    return buffer.getvalue()


def transcribe_audio(
    audio_bytes: bytes,
    *,
    model_id: str = DEFAULT_STT_MODEL,
    language_code: Optional[str] = "en",
    diarize: bool = False,
    stream: bool = False,
) -> str:
    """
    Send recorded audio to ElevenLabs STT and return the transcript text.
    """
    if stream:
        response = elevenlabs.speech_to_text.stream(
            model_id=model_id,
            language_code=language_code,
            diarize=diarize,
            audio=audio_bytes,
        )
        chunks = []
        for chunk in response:
            if isinstance(chunk, SpeechToTextChunkResponseModel):
                chunks.append(chunk.text.strip())
        return " ".join(chunks).strip()
    response = elevenlabs.speech_to_text.convert(
        model_id=model_id,
        language_code=language_code,
        diarize=diarize,
        file=("user_prompt.wav", audio_bytes, "audio/wav"),
    )
    return _extract_transcript(response)


def _extract_transcript(response: object) -> str:
    if isinstance(response, SpeechToTextChunkResponseModel):
        return response.text.strip()
    if isinstance(response, MultichannelSpeechToTextResponseModel):
        return " ".join(chunk.text.strip() for chunk in response.transcripts).strip()
    if isinstance(response, SpeechToTextWebhookResponseModel):
        raise RuntimeError(
            "Speech-to-text request is running asynchronously via webhook. "
            "Disable webhook mode for immediate transcripts."
        )
    raise RuntimeError(f"Unexpected speech-to-text response: {type(response)!r}")


def capture_user_input(
    duration_seconds: float = 6.0,
    *,
    transcribe: bool = True,
) -> tuple[Optional[str], bytes]:
    """
    Record the user, optionally transcribe, and return the transcript plus raw audio.
    """
    audio_bytes = record_audio(duration_seconds=duration_seconds)

    transcript: Optional[str] = None
    if transcribe:
        try:
            transcript = transcribe_audio(audio_bytes)
        except ApiError as exc:
            if _is_missing_permission_error(exc, "speech_to_text"):
                print(
                    "Your ElevenLabs API key is missing the 'speech_to_text' permission. "
                    "Skipping transcription but keeping the raw audio for playback."
                )
            else:
                raise

    return transcript, audio_bytes


def send_text_to_elevenlabs(
    text: str,
    *,
    voice_id: str = DEFAULT_VOICE_ID,
    model_id: str = DEFAULT_TTS_MODEL,
    output_format: TextToSpeechStreamRequestOutputFormat = DEFAULT_STREAM_FORMAT,
    playback: bool = True,
    save_to: Optional[Path | str] = None,
) -> bytes:
    """
    Convert text into speech via ElevenLabs TTS. Streams audio by default and optionally saves it.
    """
    audio_stream = elevenlabs.text_to_speech.stream(
        voice_id,
        text=text,
        model_id=model_id,
        output_format=output_format,
    )

    if playback:
        audio_bytes = play_stream(audio_stream)
    else:
        audio_bytes = b"".join(chunk for chunk in audio_stream if isinstance(chunk, bytes))

    if save_to:
        destination = Path(save_to)
        destination.write_bytes(audio_bytes)
    return audio_bytes


def capture_and_forward(
    duration_seconds: float = 6.0,
    *,
    transcribe: bool = True,
    history: Optional[List[Tuple[str, str]]] = None,
    stage_instruction: str = "follow_up_question",
) -> tuple[str, str]:
    """
    Record the user, persist the transcript, query Gemini, and respond via ElevenLabs TTS.
    """
    transcript, _ = capture_user_input(duration_seconds=duration_seconds, transcribe=transcribe)
    if not transcript:
        raise RuntimeError("Transcription failed, cannot continue the Gemini → ElevenLabs pipeline.")

    log_conversation("user", transcript)
    if history is not None:
        history.append(("user", transcript))
    assistant_reply = get_trip_response(
        transcript,
        history=history,
        stage_instruction=stage_instruction,
    )
    log_conversation("assistant", assistant_reply)
    if history is not None:
        history.append(("assistant", assistant_reply))

    send_text_to_elevenlabs(assistant_reply, playback=True)
    return transcript, assistant_reply


def playback_recording(
    audio_bytes: bytes,
    *,
    sample_rate: int = LISTEN_SAMPLE_RATE,
    channels: int = LISTEN_CHANNELS,
) -> None:
    """
    Play raw audio bytes back to the user for a quick mic check.
    """
    _ensure_audio_dependencies()

    audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
    if channels > 1:
        audio_array = audio_array.reshape(-1, channels)

    sd.play(audio_array, samplerate=sample_rate)
    sd.wait()


def record_and_playback(
    duration_seconds: float = 6.0,
    *,
    save_to: Path | str = Path("mic-check.wav"),
) -> Path:
    """
    Record audio, play it back locally, and persist it for inspection.
    """
    _, audio_bytes = capture_user_input(duration_seconds=duration_seconds, transcribe=False)
    playback_recording(audio_bytes)

    destination = Path(save_to)
    destination.write_bytes(audio_bytes)
    print(f"Saved raw microphone capture to {destination.resolve()}")
    return destination


def log_conversation(role: str, text: str, *, log_path: Path = CONVERSATION_LOG) -> Path:
    """
    Append a timestamped entry to the conversation log.
    """
    log_path.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).isoformat()
    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(f"{timestamp} | {role.upper()} | {text.strip()}\n")
    return log_path


def reset_conversation_log(log_path: Path = CONVERSATION_LOG) -> Path:
    """
    Clear the persistent conversation log so only the latest session is stored.
    """
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text("", encoding="utf-8")
    return log_path


def ensure_intro_prompt(history: List[Tuple[str, str]]) -> None:
    """
    Play the introductory greeting once per session.
    """
    if any(role == "assistant" and text == INTRO_PROMPT for role, text in history):
        return
    log_conversation("assistant", INTRO_PROMPT)
    history.append(("assistant", INTRO_PROMPT))
    send_text_to_elevenlabs(INTRO_PROMPT, playback=True)


def save_transcript(entries: Sequence[Tuple[str, str]], *, transcript_path: Path = SESSION_TRANSCRIPT) -> Path:
    """
    Persist a full session transcript after a multi-turn interaction.
    """
    transcript_path.parent.mkdir(parents=True, exist_ok=True)
    header = f"Session recorded at {datetime.now(UTC).isoformat()}\n"
    with transcript_path.open("w", encoding="utf-8") as handle:
        handle.write(header)
        for role, text in entries:
            handle.write(f"{role.upper()}: {text.strip()}\n")
    return transcript_path


def _is_missing_permission_error(error: ApiError, permission: str) -> bool:
    detail = getattr(error, "body", {}).get("detail", {})
    message = detail.get("message", "")
    status = detail.get("status")
    return status == "missing_permissions" and permission in message


def run_conversation(
    turns: int = 2,
    *,
    transcript_path: Path = SESSION_TRANSCRIPT,
) -> Path:
    """
    Run multiple conversation turns and save a consolidated transcript.
    """
    stage_sequence = _build_stage_sequence(turns)
    history: List[Tuple[str, str]] = []
    reset_conversation_log()
    ensure_intro_prompt(history)

    for turn_index, stage in enumerate(stage_sequence, start=1):
        print(f"\n--- Turn {turn_index}/{len(stage_sequence)} ({stage}) ---")
        user_text, assistant_text = capture_and_forward(
            transcribe=True,
            history=history,
            stage_instruction=stage,
        )
        print(f"User: {user_text}")
        print(f"Assistant: {assistant_text}")

    transcript_file = save_transcript(history, transcript_path=transcript_path)
    print(f"Saved session transcript to {transcript_file.resolve()}")
    return transcript_file


def _build_stage_sequence(turns: int) -> List[str]:
    if turns <= 1:
        return ["final_recommendation"]
    return ["follow_up_question"] * (turns - 1) + ["final_recommendation"]


if __name__ == "__main__":
    run_conversation()
