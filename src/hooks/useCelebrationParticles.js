import { useCallback, useState } from 'react';
import { particleConfig } from '../utils/animationConfig';

export function useCelebrationParticles() {
  const [bursts, setBursts] = useState([]);

  const fire = useCallback(() => {
    const { celebration } = particleConfig;
    const particles = Array.from({ length: celebration.count }).map((_, index) => ({
      id: `${Date.now()}-${index}`,
      x: Math.random() * 100,
      delay: Math.random() * 80,
      color: celebration.colors[Math.floor(Math.random() * celebration.colors.length)],
      rotate: Math.random() * 360,
      duration: 2000 + Math.random() * 700,
    }));
    const burst = { id: Date.now(), particles };
    setBursts((prev) => [...prev, burst]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((item) => item.id !== burst.id));
    }, 3000);
  }, []);

  return { bursts, fire };
}
