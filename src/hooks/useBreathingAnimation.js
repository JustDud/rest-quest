import { useSpring } from '@react-spring/web';
import { breathingDurations } from '../utils/animationConfig';

export function useBreathingAnimation() {
  const { inhale, hold, exhale } = breathingDurations;
  const total = inhale + hold + exhale;

  const breathing = useSpring({
    from: { scale: 0.85, opacity: 0.6 },
    to: async (next) => {
      while (true) {
        await next({ scale: 1.05, opacity: 0.9, config: { duration: inhale } });
        await next({ scale: 1.05, opacity: 0.9, config: { duration: hold } });
        await next({ scale: 0.9, opacity: 0.7, config: { duration: exhale } });
      }
    },
    config: { duration: total },
    loop: true,
  });

  return breathing;
}
