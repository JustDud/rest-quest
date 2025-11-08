# 🌊 Serenity AI — Luxury Wellness Companion

Serenity AI is a single-page React experience crafted for premium wellness journeys. It translates emotional check-ins into curated retreat stacks backed by a bespoke interaction model, organic animations, and brand-specific visuals.

## ✨ Highlights

- **Hero Ritual**: Animated mesh gradients, breathing orb, flow-state ribbon pattern, and floating particles.
- **Emotionally Intelligent Check-In**: Glassmorphic chat, AI empathy typing effect, radial biometrics, ambient sound toggle, live camera mirror.
- **Conversational Questionnaire**: Sliders, multi-select pills, dual-range budgets, autocomplete locations, mandala progress indicator.
- **AI Analysis Deck**: Morphing concentric visualization, live trigger bars (Recharts), floating focus tags.
- **Tinder-Style Deck**: Gesture-driven cards with swipe physics, learn-more modal, floating control palette.
- **Booking Recap & Celebration**: Saved stack grid, breathing CTA states, mindful ritual prompts (no global overlays).

## 🏗️ Tech Stack

- **React 18 + Vite**
- **Framer Motion** for narrative transitions
- **@react-spring/web** for breathing physics and swipe springs
- **@use-gesture/react** for drag/swipe gestures
- **Recharts** for stress-trigger visuals
- **Lucide React** for iconography
- **Tailwind CSS + custom globals** for layout/utility styling

## 📂 Project Structure

```
src/
  components/
    sections/             # Hero, EmotionalCheckIn, Preferences, Analysis, Deck, Booking, Celebration
    ui/                   # GlassCard, GradientButton, FlowPattern, ParticleField, AmbientCursor
  contexts/               # EmotionalContext, PreferencesContext, ExperiencesContext
  data/                   # experiences.js (12 curated packs)
  hooks/                  # useBreathingAnimation, useCardSwipe, useTypedText, useMediaQuery
  utils/                  # emotionAnalysis mock, animationConfig
  styles/                 # globals.css (fonts, mesh, particles)
  App.jsx                 # Section orchestration + providers
  main.jsx                # Entry point
```

## 🚀 Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle
npm run preview    # preview prod build
```

> Node 18+ recommended.

## 🔌 Connecting the Analysis Service

The React experience now talks to the Python analysis pipeline (Gemini + fallbacks) housed in `analysis/`.

1. Install the Python dependencies (once): `pip install -r requirements.txt`
2. Export `GEMINI_API_KEY` (or add it to `analysis/.env`)
3. Start the API: `uvicorn analysis.api:app --reload --port 8000`
4. (Optional) Point the frontend elsewhere with `VITE_ANALYSIS_ENDPOINT`; it defaults to `http://localhost:8000/analysis`. Override the capture endpoint with `VITE_CAMERA_CAPTURE_ENDPOINT` if you proxy it differently.
5. During the Emotional Check-In, the UI calls `/camera/capture` which briefly opens the webcam, aggregates emotions, and feeds them into the analysis request. Override the Python binary with `CAMERA_PYTHON=/path/to/python` if needed.
6. The live preview’s “Open camera” button streams `/camera/stream` (override via `VITE_CAMERA_STREAM_ENDPOINT`) so you can see the same annotated feed the backend uses.
7. Clicking “Listen” also triggers `/session/start` (override via `VITE_SESSION_ENDPOINT`) which launches the full `project/main.py` workflow in the background; poll `/session/status` to inspect progress.

When the API is unreachable, the UI automatically falls back to the in-browser heuristic analysis so flows remain demoable offline.

## 🧠 Key Concepts

- **Emotion Simulation**: `mockEmotionAnalysis` inspects text for stress/energy keywords and drives biometrics, background speed, and recommendations.
- **Global State**:
  - `EmotionalContext` — journaling entry, analysis results, particle speed.
  - `PreferencesContext` — conversational questionnaire with localStorage persistence.
  - `ExperiencesContext` — retreat deck, liked stack, undo history.
- **Interaction Patterns**:
  - Cursor-following light bloom.
  - Flowing particle systems (adjusted for mobile via custom media query hook).
  - Guided breathing CTA pulses within Celebration section (4-7-8 cadences).
  - Swipe deck with like/pass/undo controls + modal expansion.

## 🎨 Brand System

- **Colors**: Tranquil Cyan `#3BC9DB`, Deep Ocean `#1971C2`, Ethereal Mist `#E7F5FF`, Healing Green `#51CF66`, Soft Lavender `#B197FC`, Warm Sand `#FFE8CC`.
- **Typography**: Plus Jakarta Sans (headlines/UI), DM Sans (body), Crimson Pro italics (empathy tone).
- **Shapes**: Min radius 8px, organic ribbons, glass cards, floating mandala progress ring.
- **Motion**: Breathing rhythm durations (4-7-8), cubic-bezier `(0.4, 0, 0.2, 1)` transitions, float-up particles.

## ♿ Accessibility & Performance

- Semantic structure + focus-visible states with brand colors.
- Reduced-motion media query support.
- Lazy-loaded imagery, memoized particles, and spring physics tuned for 60fps.
- Keyboard actions: arrow/space for deck interactions.

## 🔮 Next Ideas

- Connect to live sentiment APIs (Reply or Claude) for real biometrics.
- Persist liked stack to backend bookings (Booking.com mock).
- Layer ambient sounds per emotion toggle.
- Add comparison modal in Booking Summary and integrate map previews.

Crafted for the Reply × Booking hackathon to feel like a bespoke $50k luxury wellness platform. Breathe in, scroll slowly, and let the UI guide you.  
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
