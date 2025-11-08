import React, { useEffect } from 'react';
import { FlowPattern } from '../components/ui/FlowPattern';
import { usePerformanceMode } from '../hooks/usePerformanceMode';

export function SerenityLayout({ children }) {
  const performanceMode = usePerformanceMode();

  useEffect(() => {
    const root = document.documentElement;
    if (performanceMode) {
      root.style.setProperty('--cursor-gradient-strength', '0.18');
    } else {
      root.style.setProperty('--cursor-gradient-strength', '0.28');
    }
  }, [performanceMode]);

  useEffect(() => {
    if (performanceMode) return undefined;
    const root = document.documentElement;
    let raf = null;
    let pulseTimeout = null;
    const updateGradient = (event) => {
      if (raf) cancelAnimationFrame(raf);
      const { clientX, clientY } = event;
      raf = requestAnimationFrame(() => {
        const xPercent = ((clientX / window.innerWidth) * 100).toFixed(2);
        const yPercent = ((clientY / window.innerHeight) * 100).toFixed(2);
        root.style.setProperty('--cursor-gradient-x', `${xPercent}%`);
        root.style.setProperty('--cursor-gradient-y', `${yPercent}%`);
        raf = null;
      });
    };
    const handlePointerDown = () => {
      root.style.setProperty('--cursor-gradient-strength', '0.45');
      if (pulseTimeout) clearTimeout(pulseTimeout);
      pulseTimeout = setTimeout(() => {
        root.style.setProperty('--cursor-gradient-strength', '0.28');
      }, 420);
    };
    window.addEventListener('pointermove', updateGradient, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (pulseTimeout) clearTimeout(pulseTimeout);
      window.removeEventListener('pointermove', updateGradient);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [performanceMode]);

  return (
    <div
      className="relative min-h-screen overflow-hidden transition-colors duration-[900ms] ease-in-out"
      style={{
        background: `
          radial-gradient(circle at var(--cursor-gradient-x, 60%) var(--cursor-gradient-y, 35%),
            rgba(255,255,255,var(--cursor-gradient-strength, 0.28)), transparent 60%),
          linear-gradient(135deg, var(--cinematic-from, #E7F5FF), var(--cinematic-to, #E0F2FF))
        `,
      }}
    >
      <FlowPattern className="opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/20 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
