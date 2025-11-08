# Gesture & Emotion Toolkit

This workspace combines the real-time emotion mesh visualizer (`project/camera.py`) with the ElevenLabs/Gemini voice agent (`project/elabs.py`). The goal is to capture the user’s facial cues (even without live audio), summarize each answer as an emotion spectrum, and turn those results into tailored travel suggestions.

## 1. Install Dependencies

```bash
./install_dependencies.sh
```

The script installs everything listed in `requirements.txt` (OpenCV, MediaPipe, DeepFace, FER, ElevenLabs SDK, Google Generative AI, etc.). Run it inside your virtual environment.

## 2. Configure API Keys

Create a `.env` file (or export env vars) with:

```
ELEVENLABS_API_KEY=...
GEMINI_API_KEY=...
```

You can also override the default ElevenLabs voice/model and Gemini model there.

## 3. Running the Emotion Visualizer

```bash
python project/camera.py
```

- The script automatically falls back to neutral guesses if no audio/mic is available.
- Drop mock video answers into `project/mock_responses/` (e.g., `q1.mp4`, `q2.mp4`) to simulate 10-second replies; the viewer will consume them before using the webcam.
- Each listening window lasts 10 seconds, records an emotion spectrum (happy 50%, angry 25%, etc.), and displays the final label plus any generated travel plans from `mock_travel_data.json`.

## 4. Using the ElevenLabs ↔ Gemini Bridge

You can either record live audio or feed a saved file:

```bash
# Live capture (defaults to 6 s, change with --duration)
python project/elabs.py --mode live --duration 8

# Use an existing WAV/MP3 recording
python project/elabs.py --mode file --audio path/to/answer.wav
```

The CLI will:
1. Capture or load the audio.
2. Transcribe it with ElevenLabs STT (if enabled).
3. Send the text to Gemini for a travel response.
4. Speak the reply back via ElevenLabs TTS and log the exchange in `conversation_log.txt`.

## 5. Tips

- If emotion labels stay at “unknown”, ensure the dependencies are installed (DeepFace + FER) and try running the tool in good lighting or with the mock videos.
- The planner uses `project/mock_travel_data.json`. Feel free to extend it with your own destinations keyed by emotion or spectrum mix.
