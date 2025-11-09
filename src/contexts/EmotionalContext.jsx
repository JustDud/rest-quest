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
export const ANALYSIS_BASE_URL = ANALYSIS_ORIGIN;

const CAMERA_CAPTURE_ENDPOINT =
  import.meta.env.VITE_CAMERA_CAPTURE_ENDPOINT || `${ANALYSIS_ORIGIN}/camera/capture`;
const CAMERA_START_ENDPOINT =
  import.meta.env.VITE_CAMERA_START_ENDPOINT || `${ANALYSIS_ORIGIN}/camera/start`;

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
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);
  const [audioRetryTick, setAudioRetryTick] = useState(0);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [listeningForResponse, setListeningForResponse] = useState(false);
  const [micStatus, setMicStatus] = useState('idle');
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
    if (!SESSION_EVENTS_ENDPOINT) return undefined;
    const source = new EventSource(SESSION_EVENTS_ENDPOINT);
    source.onopen = () => {
      setSessionError('');
    };
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
          setListeningForResponse(false);
          setCurrentQuestion(null);
        }
        if (data?.type === 'question_start') {
          setCurrentQuestion({
            index: data?.payload?.index ?? null,
            question: data?.payload?.question ?? '',
          });
          setListeningForResponse(true);
        }
        if (data?.type === 'record_prompt') {
          setListeningForResponse(true);
        }
        if (data?.type === 'record_timeout') {
          setListeningForResponse(false);
        }
        if (data?.type === 'session_closed') {
          setSessionActive(false);
          setListeningForResponse(false);
          setCurrentQuestion(null);
        } else if (data?.type) {
          setSessionActive(true);
        }
      } catch (error) {
        console.warn('Failed to parse session event', error);
      }
    };
    source.onerror = (error) => {
      console.warn('Session event stream error', error);
      setSessionError('Live session link interrupted. Refresh or restart and try again.');
    };
    return () => {
      source.close();
      setSessionActive(false);
      setListeningForResponse(false);
      setCurrentQuestion(null);
    };
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const handleEnded = () => setAudioPlaying(false);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('error', handleEnded);
    return () => {
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('error', handleEnded);
    };
  }, []);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    if (audioPlaying) return;
    if (!audioQueue.length) return;

    const nextPath = audioQueue[0];
    const source = `${AUDIO_BASE_URL}${nextPath}`;
    let cancelled = false;

    const attemptPlayback = async () => {
      try {
        audioEl.src = source;
        const playPromise = audioEl.play();
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise;
        }
        if (cancelled) return;
        setAudioNeedsInteraction(false);
        setAudioPlaying(true);
        setAudioQueue((prev) => prev.slice(1));
      } catch (error) {
        if (cancelled) return;
        console.warn('Audio playback failed', error);
        setAudioNeedsInteraction(true);
        setAudioPlaying(false);
      }
    };

    attemptPlayback();
    return () => {
      cancelled = true;
    };
  }, [audioQueue, audioPlaying, audioRetryTick]);

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

  const requestSessionAudioPlayback = useCallback(() => {
    setAudioNeedsInteraction(false);
    setAudioRetryTick((tick) => tick + 1);
  }, []);

  const startGuidedSession = useCallback(async () => {
    if (sessionStarting) return;
    setSessionStarting(true);
    setSessionError('');
    try {
      if (CAMERA_START_ENDPOINT) {
        const cameraResponse = await fetch(CAMERA_START_ENDPOINT, { method: 'POST' });
        if (!cameraResponse.ok) {
          let cameraDetail = '';
          try {
            const payload = await cameraResponse.json();
            cameraDetail = payload?.detail || payload?.status || '';
          } catch {
            cameraDetail = '';
          }
          throw new Error(cameraDetail || `Camera start failed (${cameraResponse.status})`);
        }
      }

      const response = await fetch(SESSION_START_ENDPOINT, { method: 'POST' });
      if (!response.ok && response.status !== 409) {
        let detail = '';
        try {
          const payload = await response.json();
          detail = payload?.detail || '';
        } catch {
          detail = '';
        }
        throw new Error(detail || `Session start failed: ${response.status}`);
      }

      setSessionEvents([]);
      setAudioQueue([]);
      setLiveEmotion(null);
      setCurrentQuestion(null);
      setListeningForResponse(false);
      setSessionActive(true);
    } catch (error) {
      console.warn('Full-session runner unavailable', error);
      setSessionActive(false);
      setSessionError(
        error instanceof Error ? error.message : 'Unable to start the live conversation. Please try again.'
      );
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
    } else if (
      latest.type === 'record_timeout' ||
      latest.type === 'question_complete' ||
      latest.type === 'session_closed'
    ) {
      if (micRecorder.recording) {
        micRecorder.stopRecording?.();
      }
    }
  }, [sessionEvents, micRecorder]);

  useEffect(() => {
    if (!micRecorder) return;
    const { error, permissionGranted, recording } = micRecorder;
    if (error) {
      console.warn(error);
      setSessionError((prev) => prev || error);
      setMicStatus('error');
      return;
    }
    if (!permissionGranted) {
      setMicStatus('blocked');
      return;
    }
    if (recording) {
      setMicStatus('recording');
    } else if (listeningForResponse) {
      setMicStatus('listening');
    } else {
      setMicStatus('idle');
    }
  }, [micRecorder?.error, micRecorder?.permissionGranted, micRecorder?.recording, listeningForResponse, micRecorder]);

  const value = useMemo(
    () => ({
      entry,
      setEntry,
      analysis,
      analyzing,
      analyzeEntry,
      particleSpeed,
      sessionEvents,
      sessionActive,
      sessionError,
      currentQuestion,
      listeningForResponse,
      startGuidedSession,
      sessionStarting,
      micRecorder,
      micStatus,
      audioNeedsInteraction,
      requestSessionAudioPlayback,
      liveEmotion,
    }),
    [
      entry,
      analysis,
      analyzing,
      analyzeEntry,
      particleSpeed,
      sessionEvents,
      sessionActive,
      sessionError,
      currentQuestion,
      listeningForResponse,
      startGuidedSession,
      sessionStarting,
      micRecorder,
      micStatus,
      audioNeedsInteraction,
      requestSessionAudioPlayback,
      liveEmotion,
    ]
  );

  return <EmotionalContext.Provider value={value}>{children}</EmotionalContext.Provider>;
}
