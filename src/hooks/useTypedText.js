import { useEffect, useState } from 'react';

export function useTypedText(text, delay = 30) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }
    let frame = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      frame += 1;
      setDisplayed(text.slice(0, frame));
      if (frame >= text.length) clearInterval(interval);
    }, delay);

    return () => clearInterval(interval);
  }, [text, delay]);

  return displayed;
}
