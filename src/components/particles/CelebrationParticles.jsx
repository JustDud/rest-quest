import React from 'react';

export function CelebrationParticles({ bursts = [] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {bursts.map((burst) =>
        burst.particles.map((particle) => (
          <span
            key={particle.id}
            className="absolute block rounded-lg"
            style={{
              left: `${particle.x}%`,
              top: '-10%',
              width: '10px',
              height: '18px',
              background: particle.color,
              opacity: 0.85,
              borderRadius: '4px',
              animation: `serenity-confetti ${particle.duration}ms ease-in forwards`,
              animationDelay: `${particle.delay}ms`,
              transform: `rotate(${particle.rotate}deg)`,
            }}
          />
        ))
      )}
    </div>
  );
}
