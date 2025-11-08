import React, { useEffect, useMemo, useRef } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { particleConfig } from '../../utils/animationConfig';

export function OrbParticles({ stress = 50, color = '#3BC9DB', className = '' }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const particles = useMemo(() => {
    const count = Math.round(
      particleConfig.orb.baseCount +
        ((particleConfig.orb.maxCount - particleConfig.orb.baseCount) * stress) / 100
    );
    return Array.from({ length: count }).map((_, idx) => ({
      id: idx,
      angle: Math.random() * Math.PI * 2,
      radius: 70 + Math.random() * 40,
      speed:
        particleConfig.orb.baseSpeed +
        ((particleConfig.orb.maxSpeed - particleConfig.orb.baseSpeed) * stress) / 100,
      size: 3 + Math.random() * 4,
      jitter: Math.random() * 0.02 + 0.005,
    }));
  }, [stress]);

  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const node = ref.current;
    if (!node) return undefined;
    let animationId;
    const step = () => {
      Array.from(node.children).forEach((child, index) => {
        const particle = particles[index];
        if (!particle) return;
        particle.angle += particle.speed * 0.002;
        const x = Math.cos(particle.angle) * particle.radius;
        const y = Math.sin(particle.angle) * particle.radius;
        child.style.transform = `translate(${x}px, ${y}px)`;
      });
      animationId = requestAnimationFrame(step);
    };
    animationId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationId);
  }, [particles, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} ref={ref}>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute left-1/2 top-1/2 rounded-full opacity-70"
          style={{
            width: particle.size,
            height: particle.size,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      ))}
    </div>
  );
}
