import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { mockEmotionAnalysis } from '../utils/emotionAnalysis';

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

  const analyzeEntry = useCallback(async (text) => {
    if (!text.trim()) return;
    setAnalyzing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const result = mockEmotionAnalysis(text);
    setAnalysis(result);
    setAnalyzing(false);
  }, []);

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
