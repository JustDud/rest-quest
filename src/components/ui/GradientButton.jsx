import React, { useRef } from 'react';
import { useRipple } from '../../hooks/useRipple';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(25,113,194,0.25)] transition duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]';

export function GradientButton({ children, className = '', ...props }) {
  const ref = useRef(null);
  useRipple(ref, { color: 'rgba(255,255,255,0.45)' });

  return (
    <button
      ref={ref}
      className={`${base} bg-gradient-to-r from-[#1971C2] via-[#3BC9DB] to-[#51CF66] hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
