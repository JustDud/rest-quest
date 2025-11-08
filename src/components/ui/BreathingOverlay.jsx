import React, { useEffect, useState } from 'react';
import { animated } from '@react-spring/web';
import { useBreathingAnimation } from '../../hooks/useBreathingAnimation';

export function BreathingOverlay() {
  const [visible, setVisible] = useState(false);
  const breathing = useBreathingAnimation();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0b1728]/70 backdrop-blur-2xl">
      <div className="text-center text-white space-y-6">
        <p className="text-sm uppercase tracking-[0.5em] text-white/80">Press space to close</p>
        <p className="text-3xl font-semibold">Breathe with me · 4 · 7 · 8</p>
        <animated.div
          style={breathing}
          className="w-56 h-56 rounded-full bg-gradient-to-br from-[#3BC9DB] via-[#1971C2] to-[#B197FC] opacity-80"
        />
      </div>
    </div>
  );
}
