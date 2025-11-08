import React from 'react';

const base =
  'glass-card rounded-[32px] bg-white/60 border border-white/50 shadow-[0_10px_40px_rgba(25,113,194,0.12)] backdrop-blur-3xl';

export function GlassCard({ className = '', children, ...props }) {
  return (
    <div className={`${base} ${className}`} {...props}>
      {children}
    </div>
  );
}
