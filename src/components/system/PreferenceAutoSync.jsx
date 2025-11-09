import { useContext, useEffect, useMemo, useRef } from 'react';
import { EmotionalContext } from '../../contexts/EmotionalContext';
import { PreferencesContext } from '../../contexts/PreferencesContext';

const EXPERIENCE_LIBRARY = {
  stressed: ['Ocean rituals', 'Spa cocoon'],
  anxious: ['Forest therapy', 'Sound baths'],
  angry: ['Mountain silence', 'Sound baths'],
  sad: ['Forest therapy', 'Ocean rituals'],
  fearful: ['Spa cocoon', 'Sound baths'],
  surprised: ['Movement play', 'Ocean rituals'],
  happy: ['Movement play', 'Ocean rituals'],
  calm: ['Ocean rituals', 'Mountain silence'],
  neutral: ['Forest therapy', 'Ocean rituals'],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normaliseDominant = (value) => {
  if (!value) return 'neutral';
  return String(value).toLowerCase();
};

const spectrumToMetrics = (entry) => {
  if (!entry) return null;
  const spectrum = entry.spectrum || {};
  const dominant =
    entry.dominant ||
    Object.entries(spectrum).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'neutral';
  const negative =
    (spectrum.angry ?? 0) + (spectrum.disgust ?? 0) + (spectrum.fear ?? 0) + (spectrum.sad ?? 0);
  const positive = (spectrum.happy ?? 0) + (spectrum.surprise ?? 0);
  const calm = spectrum.neutral ?? 0;
  const stress = clamp(Math.round(25 + negative * 75), 10, 95);
  const energy = clamp(Math.round(35 + positive * 60 + (spectrum.surprise ?? 0) * 20 - calm * 25), 5, 95);
  const valence = clamp(Math.round(55 + (positive - negative) * 60), 5, 95);
  return { stress, energy, valence, dominant };
};

const pickTravelMood = ({ stress, valence, energy, dominant }) => {
  if (stress >= 80) return 'Deep nervous system reset';
  if (stress >= 60) return 'Nurturing decompression';
  if (energy >= 70 && valence >= 55) return 'Playful exploration';
  if (energy <= 35) return 'Gentle restoration';
  if (normaliseDominant(dominant) === 'happy') return 'Joy-forward wander';
  return 'Balanced recalibration';
};

const pickIntensity = ({ stress, energy }) => {
  const blended = Math.round(0.6 * energy + 0.4 * (100 - stress));
  return clamp(blended, 15, 90);
};

const pickRitualPace = ({ stress, energy }) => {
  if (stress >= 70) return 'guided';
  if (energy >= 70 && stress < 55) return 'loose';
  return 'balanced';
};

const pickTimeWindow = ({ stress }) => {
  if (stress >= 70) return 'soon';
  if (stress <= 35) return 'later';
  return 'next-month';
};

const suggestExperiences = (dominant) => {
  const key = normaliseDominant(dominant);
  if (EXPERIENCE_LIBRARY[key]) {
    return EXPERIENCE_LIBRARY[key];
  }
  return ['Ocean rituals', 'Forest therapy'];
};

const derivePreferenceTargets = (metrics) => {
  if (!metrics) return null;
  const travelMood = pickTravelMood(metrics);
  const intensity = pickIntensity(metrics);
  const ritualPace = pickRitualPace(metrics);
  const timeWindow = pickTimeWindow(metrics);
  const experiences = suggestExperiences(metrics.dominant);
  return { travelMood, intensity, ritualPace, timeWindow, experiences };
};

const applyTargets = (targets, autoUpdatePreference) => {
  if (!targets || !autoUpdatePreference) return;
  Object.entries(targets).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    autoUpdatePreference(key, value);
  });
};

export function PreferenceAutoSync() {
  const emotional = useContext(EmotionalContext);
  const preferences = useContext(PreferencesContext);
  const lastSessionUpdate = useRef(null);

  const analysisMetrics = useMemo(() => {
    if (!emotional?.analysis) return null;
    const payload = emotional.analysis;
    return {
      stress: payload.stress ?? 50,
      energy: payload.energy ?? 45,
      valence: payload.valence ?? 50,
      dominant: payload.dominant_emotion ?? payload.overall_mood ?? payload.dominant ?? 'neutral',
    };
  }, [emotional?.analysis]);

  useEffect(() => {
    if (!analysisMetrics) return;
    applyTargets(derivePreferenceTargets(analysisMetrics), preferences?.autoUpdatePreference);
  }, [analysisMetrics, preferences?.autoUpdatePreference]);

  useEffect(() => {
    const events = emotional?.sessionEvents;
    if (!events?.length || !preferences?.autoUpdatePreference) return;
    const latest = events[events.length - 1];
    if (latest?.type !== 'question_complete') return;
    const entry = latest.payload?.entry;
    const marker = entry?.transcript
      ? `${latest.payload?.index ?? latest.timestamp}-${entry.transcript.slice(0, 32)}`
      : `${latest.payload?.index ?? latest.timestamp}-no-transcript`;
    if (lastSessionUpdate.current === marker) return;
    lastSessionUpdate.current = marker;
    const metrics = spectrumToMetrics(entry);
    applyTargets(derivePreferenceTargets(metrics), preferences.autoUpdatePreference);
  }, [emotional?.sessionEvents, preferences?.autoUpdatePreference]);

  return null;
}
