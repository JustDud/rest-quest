import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mockEmotionAnalysis } from '../utils/emotionAnalysis';
import { useMicrophoneRecorder } from '../hooks/useMicrophoneRecorder';

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
const SESSION_EVENTS_ENDPOINT =
  import.meta.env.VITE_SESSION_EVENTS_ENDPOINT || `${ANALYSIS_ORIGIN}/session/events`;
const AUDIO_BASE_URL = ANALYSIS_ORIGIN;

export const EmotionalContext = createContext(null);

export function EmotionalProvider({ children }) {
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [particleSpeed, setParticleSpeed] = useState(1);
  const [sessionEvents, setSessionEvents] = useState([]);
  const [audioQueue, setAudioQueue] = useState([]);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const audioRef = useRef(typeof Audio !== 'undefined' ? new Audio() : null);
  const [liveEmotion, setLiveEmotion] = useState(null);
  const micRecorder = useMicrophoneRecorder({
    endpoint: `${ANALYSIS_ORIGIN}/session/audio`,
  });

  useEffect(() => {
    if (!analysis) return;
    const capped = Math.max(0.6, Math.min(2.2, analysis.stress / 50));
    setParticleSpeed(capped);
  }, [analysis]);

  useEffect(() => {
    if (!SESSION_EVENTS_ENDPOINT) return;
    const source = new EventSource(SESSION_EVENTS_ENDPOINT);
    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setSessionEvents((prev) => [...prev.slice(-50), data]);
        if (data?.type === 'spoken_line' && data?.payload?.audio) {
          setAudioQueue((queue) => [...queue, data.payload.audio]);
        }
        if (data?.type === 'question_complete' && data?.payload?.entry?.spectrum) {
          setLiveEmotion({
            spectrum: data.payload.entry.spectrum,
            dominant: data.payload.entry.dominant,
            timestamp: data.timestamp,
          });
        }
      } catch (error) {
        console.warn('Failed to parse session event', error);
      }
    };
    source.onerror = (error) => {
      console.warn('Session event stream error', error);
    };
    return () => {
      source.close();
    };
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioPlaying) return;
    if (!audioQueue.length) return;

    const [next, ...rest] = audioQueue;
    setAudioQueue(rest);
    setAudioPlaying(true);
    audioEl.src = `${AUDIO_BASE_URL}${next}`;
    audioEl.play().catch((error) => {
      console.warn('Audio playback failed', error);
      setAudioPlaying(false);
    });

    const handleEnded = () => setAudioPlaying(false);
    audioEl.addEventListener('ended', handleEnded, { once: true });
    return () => {
      audioEl.removeEventListener('ended', handleEnded);
    };
  }, [audioQueue, audioPlaying]);

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

  const startGuidedSession = useCallback(async () => {
    if (sessionStarting) return;
    setSessionStarting(true);
    try {
      const response = await fetch(SESSION_START_ENDPOINT, { method: 'POST' });
      if (!response.ok && response.status !== 409) {
        throw new Error(`Session start failed: ${response.status}`);
      }
    } catch (error) {
      console.warn('Full-session runner unavailable', error);
    } finally {
      setSessionStarting(false);
    }
  }, [sessionStarting]);

  const analyzeEntry = useCallback(async (text) => {
    if (!text.trim()) return;
    setAnalyzing(true);
    const fallback = () => mockEmotionAnalysis(text);

    try {
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
  }, [captureCameraEmotion]);

  useEffect(() => {
    if (!sessionEvents.length || !micRecorder) return;
    const latest = sessionEvents[sessionEvents.length - 1];
    if (latest.type === 'record_prompt') {
      if (!micRecorder.recording) {
        micRecorder.startRecording?.();
      }
    } else if (latest.type === 'record_timeout' || latest.type === 'question_complete') {
      if (micRecorder.recording) {
        micRecorder.stopRecording?.();
      }
    }
  }, [sessionEvents, micRecorder]);

  useEffect(() => {
    if (micRecorder?.error) {
      console.warn(micRecorder.error);
    }
  }, [micRecorder?.error]);

  const value = useMemo(
    () => ({
      entry,
      setEntry,
      analysis,
      analyzing,
      analyzeEntry,
      particleSpeed,
      sessionEvents,
      startGuidedSession,
      sessionStarting,
      micRecorder,
      liveEmotion,
    }),
    [
      entry,
      analysis,
      analyzing,
      analyzeEntry,
      particleSpeed,
      sessionEvents,
      startGuidedSession,
      sessionStarting,
      micRecorder,
      liveEmotion,
    ]
  );

  return <EmotionalContext.Provider value={value}>{children}</EmotionalContext.Provider>;
}
