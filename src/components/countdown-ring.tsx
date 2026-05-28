'use client';
import { useEffect, useState } from 'react';

interface CountdownRingProps {
  scheduledAt: string;
  size?: number;
}

export function CountdownRing({ scheduledAt, size = 64 }: CountdownRingProps) {
  const [remaining, setRemaining] = useState(() => computeRemaining(scheduledAt));

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeRemaining(scheduledAt)), 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (remaining.totalSeconds > 15 * 60) return null;

  if (remaining.totalSeconds <= 0) {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--slc-coral)', letterSpacing: '-0.02em' }}>지금</span>
      </div>
    );
  }

  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining.totalSeconds / (15 * 60);
  const dashOffset = circumference * (1 - progress);
  const minutes = Math.floor(remaining.totalSeconds / 60);
  const seconds = remaining.totalSeconds % 60;
  const timeLabel = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <defs>
        <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8A898" />
          <stop offset="100%" stopColor="var(--slc-coral)" />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--slc-border)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none"
        stroke="url(#ring-grad)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 3px rgba(196, 97, 74, 0.4))' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        fill="var(--slc-coral)" fontSize={10} fontWeight={700} fontFamily="system-ui"
      >
        {timeLabel}
      </text>
    </svg>
  );
}

function computeRemaining(scheduledAt: string) {
  const diff = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
  return { totalSeconds: Math.floor(diff / 1000) };
}
