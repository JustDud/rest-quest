import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

const isLowEndDevice = () => {
  if (typeof navigator === 'undefined') return false;
  const lowThreads = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const saveData = navigator.connection?.saveData;
  return lowThreads || Boolean(saveData);
};

const isCompactViewport = () => (typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

export function usePerformanceMode() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [performanceMode, setPerformanceMode] = useState(prefersReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const evaluate = () => {
      setPerformanceMode(prefersReducedMotion || isLowEndDevice() || isCompactViewport());
    };
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, [prefersReducedMotion]);

  return performanceMode;
}
