import React from 'react';
import { motion } from 'framer-motion';

const shapes = [
  { size: 120, blur: 50, color: 'rgba(59,201,219,0.5)', top: '10%', left: '15%' },
  { size: 90, blur: 40, color: 'rgba(177,151,252,0.45)', top: '45%', left: '60%' },
  { size: 60, blur: 30, color: 'rgba(81,207,102,0.45)', top: '70%', left: '30%' },
];

export function HeroVisual({ emotion = 'calm' }) {
  const palette = {
    stressed: ['#FF6B6B', '#FF9F43', '#FFE8CC'],
    anxious: ['#F9A8D4', '#FEC260', '#FFE8F1'],
    calm: ['#51CF66', '#3BC9DB', '#E7F5FF'],
    peaceful: ['#3BC9DB', '#B197FC', '#E7F5FF'],
  }[emotion] || ['#748FFC', '#B197FC', '#E7F5FF'];

  return (
    <motion.div
      className="rounded-[32px] bg-gradient-to-br from-white/80 to-[#F5F9FF] border border-white/60 shadow-[0_20px_60px_rgba(11,23,40,0.15)] overflow-hidden relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="p-8 space-y-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1971C2] via-[#3BC9DB] to-[#B197FC] opacity-80 shadow-glow" />
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.4em] text-[#1971C2]/60">Journey spark</p>
          <p className="text-3xl font-semibold text-[#0B1728]">
            {emotion === 'stressed'
              ? 'Let’s steady your nervous system'
              : emotion === 'anxious'
                ? 'Grounding in progress'
                : 'Serenity syncing'}
          </p>
          <p className="text-sm text-[#0B1728]/60">
            Real-time emotional telemetry paints this canvas — watch the colors soften as you breathe.
          </p>
        </div>
        <div className="flex gap-3 text-xs text-[#0B1728]/60">
          {palette.map((color) => (
            <span
              key={color}
              className="flex-1 h-2 rounded-full"
              style={{ background: `linear-gradient(90deg, ${color}33, ${color})` }}
            />
          ))}
        </div>
      </div>
      {shapes.map((shape, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full"
          style={{
            width: shape.size,
            height: shape.size,
            top: shape.top,
            left: shape.left,
            background: shape.color,
            filter: `blur(${shape.blur}px)`,
          }}
          animate={{ scale: [0.9, 1.05, 0.9] }}
          transition={{ duration: 8 + index * 1.5, repeat: Infinity }}
        />
      ))}
    </motion.div>
  );
}
