import { useCallback, useMemo, useState } from 'react';
import { useGesture } from '@use-gesture/react';
import { useSpring } from '@react-spring/web';

const swipeThreshold = 120;

export function useCardSwipe({ onLike, onPass, onInfo } = {}) {
  const [isDragging, setDragging] = useState(false);
  const [{ x, y, rotate, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    scale: 1,
    config: { friction: 18, tension: 320 },
  }));

  const bind = useGesture(
    {
      onDrag: ({ active, movement: [mx, my], velocity: [vx], direction: [dx], cancel, tap }) => {
        if (tap) return;
        setDragging(active);
        api.start({ x: mx, y: my, rotate: mx / 20, scale: active ? 1.02 : 1 });
        if (!active) {
          if (mx > swipeThreshold || (vx > 0.5 && dx > 0)) {
            api.start({ x: 600, rotate: 25, opacity: 0 });
            onLike?.();
            cancel();
          } else if (mx < -swipeThreshold || (vx > 0.5 && dx < 0)) {
            api.start({ x: -600, rotate: -25, opacity: 0 });
            onPass?.();
            cancel();
          } else if (my < -swipeThreshold) {
            onInfo?.();
            api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
          } else {
            api.start({ x: 0, y: 0, rotate: 0, scale: 1 });
          }
        }
      },
      onDragEnd: () => setDragging(false),
    },
    { drag: { filterTaps: true, axis: 'lock' } }
  );

  return { bind, isDragging, style: { x, y, rotate, scale } };
}
