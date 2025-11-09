import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const wingStates = {
  hovering: { flap: 10, duration: 1.4 },
  flying: { flap: 26, duration: 0.6 },
  transitioning: { flap: 18, duration: 0.9 },
};

const mobileBreakpoint = 768;

export function SpiritBird({ position, state, message, tilt = 0, trail = [], currentSection, disabled }) {
  const [isHovered, setIsHovered] = useState(false);
  const [lastClick, setLastClick] = useState(null);

  useEffect(() => {
    if (!lastClick) return undefined;
    const timer = setTimeout(() => setLastClick(null), 650);
    return () => clearTimeout(timer);
  }, [lastClick]);

  const { flap, duration } = wingStates[state] ?? wingStates.hovering;
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false;
  const size = isMobile ? { width: 60, height: 45 } : { width: 80, height: 60 };
  const tooltip = isHovered ? message : null;
  const gradientId = useMemo(() => `spirit-bird-${currentSection}`, [currentSection]);

  const handleClick = () => setLastClick(Date.now());

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden="true">
      {trail.map((particle) => (
        <motion.span
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 6,
            height: 6,
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            background: 'linear-gradient(135deg, rgba(6,182,212,0.65), rgba(20,184,166,0.45))',
            filter: 'blur(2px)',
          }}
          initial={{ opacity: 0.7, scale: 1 }}
          animate={{ opacity: 0, scale: 0.4, y: 8 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className="pointer-events-none"
        initial={{ x: position.x, y: position.y, opacity: 0 }}
        animate={{
          x: position.x,
          y: position.y,
          opacity: disabled ? 0.45 : 0.85,
          scale: isHovered ? 1.12 : 1,
          rotate: tilt,
        }}
        transition={{ duration: disabled ? 0 : 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <button
          type="button"
          className="spirit-bird pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 rounded-full"
          style={{ width: size.width, height: size.height }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleClick}
        >
          <motion.svg
            width={size.width}
            height={size.height}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_12px_32px_rgba(15,118,110,0.35)]"
            animate={{
              rotate: isHovered ? [0, 2, -2, 0] : 0,
              scale: 1 + Math.sin(Date.now() / 2000) * 0.01,
            }}
          >
            <defs>
              <linearGradient id={`${gradientId}-body`} x1="20" x2="100" y1="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop stopColor="rgba(6,182,212,0.85)" />
                <stop offset="1" stopColor="rgba(20,184,166,0.55)" />
              </linearGradient>
              <linearGradient id={`${gradientId}-wing`} x1="0" x2="60" y1="30" y2="30">
                <stop stopColor="rgba(222,255,255,0.9)" />
                <stop offset="1" stopColor="rgba(6,182,212,0.7)" />
              </linearGradient>
              <radialGradient id={`${gradientId}-glow`} cx="50%" cy="50%" r="60%">
                <stop offset="0%" stopColor="rgba(6,182,212,0.45)" />
                <stop offset="100%" stopColor="rgba(6,182,212,0)" />
              </radialGradient>
            </defs>

            <circle cx="60" cy="60" r="40" fill={`url(#${gradientId}-glow)`} opacity="0.6" />

            <motion.g
              animate={{
                y: disabled ? 0 : [0, -2, 0, 2, 0],
                transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              <ellipse cx="60" cy="70" rx="20" ry="30" fill={`url(#${gradientId}-body)`} opacity="0.85" />
              <circle cx="60" cy="40" r="16" fill="rgba(255,255,255,0.8)" opacity="0.9" />
              <circle cx="65" cy="35" r="4" fill="#0B1728" opacity="0.6" />
              <path
                d="M60 92 L55 104"
                stroke="rgba(20,184,166,0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M65 92 L70 104"
                stroke="rgba(20,184,166,0.6)"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </motion.g>

            <motion.g
              transformorigin="50 55"
              animate={{ rotate: [-flap, flap, -flap] }}
              transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M60 50 C 35 40, 20 32, 8 28 C 24 40, 30 46, 48 52 Z"
                fill={`url(#${gradientId}-wing)`}
                opacity="0.8"
              />
            </motion.g>

            <motion.g
              transformorigin="70 55"
              animate={{ rotate: [flap, -flap, flap] }}
              transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path
                d="M60 50 C 85 40, 100 32, 112 28 C 96 40, 90 46, 72 52 Z"
                fill={`url(#${gradientId}-wing)`}
                opacity="0.8"
              />
            </motion.g>
          </motion.svg>
        </button>

        <AnimatePresence>
          {tooltip && (
            <motion.div
              key="bird-tooltip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
              className="pointer-events-none mt-2 rounded-full bg-white/70 px-4 py-2 text-xs text-[#0F172A] backdrop-blur-lg shadow-lg"
            >
              {tooltip}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lastClick && (
            <motion.div
              key={lastClick}
              className="pointer-events-none absolute inset-0 rounded-full border border-white/60"
              initial={{ opacity: 0.8, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
