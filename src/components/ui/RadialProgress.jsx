import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export function RadialProgress({
  value = 0,
  size = 120,
  strokeWidth = 10,
  label,
  colors = ['#1971C2', '#3BC9DB'],
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const [displayValue, setDisplayValue] = useState(0);
  const [dash, setDash] = useState(circumference);

  useEffect(() => {
    const controls = animate(0, clamped, {
      duration: 0.9,
      ease: 'easeInOut',
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
        const percentage = Math.max(0.001, latest / 100);
        setDash(circumference * (1 - percentage));
      },
    });
    return () => controls.stop();
  }, [clamped, circumference]);

  const gradientId = `radial-${label?.replace(/\s+/g, '-') ?? 'progress'}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="100%" stopColor={colors[1]} />
        </linearGradient>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#E7F5FF"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dash}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <text
        x="50%"
        y="48%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.24}
        fontWeight="600"
        fill="#0B1728"
      >
        {displayValue}%
      </text>
      {label && (
        <text
          x="50%"
          y="68%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize={size * 0.12}
          fill="#6B7B8F"
        >
          {label}
        </text>
      )}
    </svg>
  );
}
