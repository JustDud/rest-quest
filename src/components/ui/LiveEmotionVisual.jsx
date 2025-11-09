import React, { useMemo } from 'react';

const COLORS = {
  angry: '#FF6B6B',
  disgust: '#40C057',
  fear: '#5C7CFA',
  happy: '#FFD43B',
  sad: '#748FFC',
  surprise: '#FCC419',
  neutral: '#ADB5BD',
};

export function LiveEmotionVisual({ emotion }) {
  const data = useMemo(() => {
    if (!emotion?.spectrum) return null;
    return Object.entries(emotion.spectrum)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => b.value - a.value);
  }, [emotion]);

  if (!data || !data.length) {
    return (
      <div className="rounded-2xl bg-white/70 border border-white/60 p-4 text-xs text-[#0B1728]/60">
        Waiting for the first emotion scan…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/80 border border-white/70 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <p className="uppercase tracking-[0.4em] text-[11px] text-[#1971C2]/70">Live emotion</p>
        <span className="text-xs text-[#0B1728]/60">
          Dominant: <strong className="text-[#0B1728]">{emotion.dominant ?? 'neutral'}</strong>
        </span>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.key}>
            <div className="flex justify-between text-xs text-[#0B1728]/70">
              <span className="capitalize">{item.key}</span>
              <span>{Math.round(item.value * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#E7F5FF]">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(item.value * 100)}%`,
                  backgroundColor: COLORS[item.key] || '#3BC9DB',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
