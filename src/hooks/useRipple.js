import { useEffect } from 'react';

export function useRipple(ref, options = {}) {
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const handlePointerDown = (event) => {
      const rect = node.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'serenity-ripple';
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      ripple.style.setProperty('--ripple-color', options.color || 'rgba(255,255,255,0.4)');
      node.appendChild(ripple);
      setTimeout(() => ripple.remove(), 550);
    };

    node.addEventListener('pointerdown', handlePointerDown);
    return () => node.removeEventListener('pointerdown', handlePointerDown);
  }, [ref, options.color]);
}
