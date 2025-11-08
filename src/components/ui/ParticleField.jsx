import React, { useMemo } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePerformanceMode } from '../../hooks/usePerformanceMode';

const palette = ['#3BC9DB', '#1971C2', '#B197FC', '#51CF66'];

export function ParticleField({ count = 30, speed = 1, className = '' }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const performanceMode = usePerformanceMode();

  const effectiveCount = useMemo(() => {
    if (prefersReducedMotion) return 0;
    const density = isMobile ? 0.45 : 1;
    const performanceFactor = performanceMode ? 0.6 : 1;
    return Math.max(0, Math.round(count * density * performanceFactor));
  }, [prefersReducedMotion, isMobile, performanceMode, count]);

  const particles = useMemo(
    () =>
      Array.from({ length: effectiveCount }).map((_, index) => ({
        id: index,
        size: Math.random() * 6 + 2,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 18 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.4,
        color: palette[Math.floor(Math.random() * palette.length)],
      })),
    [effectiveCount]
  );

  if (!effectiveCount) return null;

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full blur-[1px]"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            bottom: '-20px',
            background: particle.color,
            opacity: particle.opacity,
            animation: `float-up ${particle.duration / speed}s linear ${particle.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
