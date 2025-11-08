import React, { useEffect, useRef, useState } from 'react';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function AmbientCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frame = useRef(null);
  const performanceMode = usePerformanceMode();
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (performanceMode || prefersReducedMotion) return undefined;
    const handleMove = (event) => {
      if (frame.current) return;
      const { clientX, clientY } = event;
      frame.current = requestAnimationFrame(() => {
        setPos({ x: clientX, y: clientY });
        frame.current = null;
      });
    };
    window.addEventListener('pointermove', handleMove);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [performanceMode, prefersReducedMotion]);

  if (performanceMode || prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[5]"
      style={{
        background: `radial-gradient(520px at ${pos.x}px ${pos.y}px, rgba(59,201,219,0.16), transparent 65%)`,
        mixBlendMode: 'screen',
        willChange: 'opacity',
      }}
    />
  );
}
