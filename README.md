# 🌊 Serenity AI — Luxury Wellness Companion

Serenity AI is a single-page React experience crafted for premium wellness journeys. It translates emotional check-ins into curated retreat stacks backed by a bespoke interaction model, organic animations, and brand-specific visuals.

## ✨ Highlights

- **Hero Ritual**: Animated mesh gradients, breathing orb, flow-state ribbon pattern, and floating particles.
- **Emotionally Intelligent Check-In**: Glassmorphic chat, AI empathy typing effect, radial biometrics, ambient sound toggle.
- **Conversational Questionnaire**: Sliders, multi-select pills, dual-range budgets, autocomplete locations, mandala progress indicator.
- **AI Analysis Deck**: Morphing concentric visualization, live trigger bars (Recharts), floating focus tags.
- **Tinder-Style Deck**: Gesture-driven cards with swipe physics, learn-more modal, floating control palette.
- **Booking Recap & Celebration**: Saved stack grid, breathing CTA states, breathing overlay toggled with spacebar.

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
    ui/                   # GlassCard, GradientButton, FlowPattern, ParticleField, AmbientCursor, BreathingOverlay
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

## 🧠 Key Concepts

- **Emotion Simulation**: `mockEmotionAnalysis` inspects text for stress/energy keywords and drives biometrics, background speed, and recommendations.
- **Global State**:
  - `EmotionalContext` — journaling entry, analysis results, particle speed.
  - `PreferencesContext` — conversational questionnaire with localStorage persistence.
  - `ExperiencesContext` — retreat deck, liked stack, undo history.
- **Interaction Patterns**:
  - Cursor-following light bloom.
  - Flowing particle systems (adjusted for mobile via custom media query hook).
  - Breathing overlay toggled with spacebar (4-7-8 cadences).
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
- Keyboard actions: arrow/space for deck interactions, spacebar toggles breathing overlay.

## 🔮 Next Ideas

- Connect to live sentiment APIs (Reply or Claude) for real biometrics.
- Persist liked stack to backend bookings (Booking.com mock).
- Layer ambient sounds per emotion toggle.
- Add comparison modal in Booking Summary and integrate map previews.

Crafted for the Reply × Booking hackathon to feel like a bespoke $50k luxury wellness platform. Breathe in, scroll slowly, and let the UI guide you.  
