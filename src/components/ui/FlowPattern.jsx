import React from 'react';

export function FlowPattern({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1440 900"
      className={`absolute inset-0 w-full h-full opacity-40 mix-blend-screen ${className}`}
    >
      <defs>
        <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1971C2" />
          <stop offset="50%" stopColor="#3BC9DB" />
          <stop offset="100%" stopColor="#51CF66" />
        </linearGradient>
      </defs>
      <path
        d="M0,500 C240,420 480,620 720,520 C960,420 1200,620 1440,540 L1440,900 L0,900 Z"
        fill="url(#flowGradient)"
        opacity="0.25"
      />
      <path
        d="M0,420 C240,520 480,320 720,420 C960,520 1200,320 1440,420"
        stroke="url(#flowGradient)"
        strokeWidth="80"
        fill="none"
        strokeLinecap="round"
        opacity="0.2"
      />
    </svg>
  );
}
