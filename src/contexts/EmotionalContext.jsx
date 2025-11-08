import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { mockEmotionAnalysis } from '../utils/emotionAnalysis';

const DEFAULT_ANALYSIS_ENDPOINT = 'http://localhost:8000/analysis';
const ANALYSIS_ENDPOINT = import.meta.env.VITE_ANALYSIS_ENDPOINT || DEFAULT_ANALYSIS_ENDPOINT;

const ANALYSIS_ORIGIN = (() => {
  try {
    return new URL(ANALYSIS_ENDPOINT).origin;
  } catch {
    return 'http://localhost:8000';
  }
})();

const CAMERA_CAPTURE_ENDPOINT =
  import.meta.env.VITE_CAMERA_CAPTURE_ENDPOINT || `${ANALYSIS_ORIGIN}/camera/capture`;

const SESSION_START_ENDPOINT =
  import.meta.env.VITE_SESSION_ENDPOINT || `${ANALYSIS_ORIGIN}/session/start`;

export const EmotionalContext = createContext(null);

export function EmotionalProvider({ children }) {
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [particleSpeed, setParticleSpeed] = useState(1);

  useEffect(() => {
    if (!analysis) return;
    const capped = Math.max(0.6, Math.min(2.2, analysis.stress / 50));
    setParticleSpeed(capped);
  }, [analysis]);

  const captureCameraEmotion = useCallback(async () => {
    try {
      const response = await fetch(CAMERA_CAPTURE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seconds: 6,
          warmup: 1.5,
          question: 'Emotional Check-In',
          prompt: 'Camera mood spectrum',
        }),
      });
      if (!response.ok) {
        throw new Error(`Camera capture error: ${response.status}`);
      }
      const payload = await response.json();
      if (payload?.spectrum) {
        return payload;
      }
    } catch (error) {
      console.warn('Camera capture unavailable', error);
    }
    return null;
  }, []);

  const startFullSession = useCallback(async () => {
    try {
      const response = await fetch(SESSION_START_ENDPOINT, { method: 'POST' });
      if (!response.ok && response.status !== 409) {
        throw new Error(`Session start failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Full-session runner unavailable', error);
    }
  }, []);

  const analyzeEntry = useCallback(async (text) => {
    if (!text.trim()) return;
    setAnalyzing(true);
    const fallback = () => mockEmotionAnalysis(text);

    try {
      startFullSession();
      const cameraCapture = await captureCameraEmotion();
      const visualFrames = [];
      if (cameraCapture?.spectrum) {
        visualFrames.push({
          question: 1,
          prompt: cameraCapture.prompt ?? 'Camera spectrum',
          spectrum: cameraCapture.spectrum,
          notes: `Dominant ${cameraCapture.dominant ?? 'neutral'} • duration ${cameraCapture.seconds ?? 0}s`,
        });
      }

      const response = await fetch(ANALYSIS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry: text,
          voiceTranscript: text,
          visualEmotionTranscript: visualFrames,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis service error: ${response.status}`);
      }

      const payload = await response.json();
      const normalized = payload?.analysis ?? payload;
      if (
        typeof normalized?.stress !== 'number' ||
        typeof normalized?.energy !== 'number' ||
        typeof normalized?.valence !== 'number'
      ) {
        throw new Error('Analysis payload missing core fields');
      }

      setAnalysis(normalized);
    } catch (error) {
      console.warn('Falling back to client-side mock analysis', error);
      setAnalysis(fallback());
    } finally {
      setAnalyzing(false);
    }
  }, [captureCameraEmotion, startFullSession]);

  const value = useMemo(
    () => ({
      entry,
      setEntry,
      analysis,
      analyzing,
      analyzeEntry,
      particleSpeed,
    }),
    [entry, analysis, analyzing, analyzeEntry, particleSpeed]
  );

  return <EmotionalContext.Provider value={value}>{children}</EmotionalContext.Provider>;
}
