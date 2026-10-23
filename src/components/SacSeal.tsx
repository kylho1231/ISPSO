'use client';

import React from 'react';

interface SacSealProps {
  className?: string;
  size?: number;
}

export const SacSeal: React.FC<SacSealProps> = ({ className = 'h-16 w-16', size = 64 }) => {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Circle & Double Border */}
      <circle cx="100" cy="100" r="95" stroke="#780000" strokeWidth="6" fill="#fdf8f5" />
      <circle cx="100" cy="100" r="90" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
      <circle cx="100" cy="100" r="75" stroke="#780000" strokeWidth="3" />

      {/* Circular Text Path simulation */}
      <path
        id="textPathTop"
        d="M 25 100 A 75 75 0 0 1 175 100"
        fill="none"
      />
      <text fill="#780000" fontSize="10.5" fontWeight="900" letterSpacing="2.5" textAnchor="middle">
        <textPath href="#textPathTop" startOffset="50%">
          ST. ANTHONY&apos;S COLLEGE
        </textPath>
      </text>

      <path
        id="textPathBottom"
        d="M 175 100 A 75 75 0 0 1 25 100"
        fill="none"
      />
      <text fill="#780000" fontSize="9.5" fontWeight="900" letterSpacing="2" textAnchor="middle">
        <textPath href="#textPathBottom" startOffset="50%">
          SAN JOSE, ANTIQUE
        </textPath>
      </text>

      {/* Decorative Stars */}
      <polygon points="22,100 24,96 28,96 25,93 26,89 22,91 18,89 19,93 16,96 20,96" fill="#f59e0b" />
      <polygon points="178,100 180,96 184,96 181,93 182,89 178,91 174,89 175,93 172,96 176,96" fill="#f59e0b" />

      {/* Inner Quartered Shield */}
      <circle cx="100" cy="100" r="54" stroke="#780000" strokeWidth="3" fill="#ffffff" />
      <line x1="100" y1="46" x2="100" y2="154" stroke="#780000" strokeWidth="3" />
      <line x1="46" y1="100" x2="154" y2="100" stroke="#780000" strokeWidth="3" />

      {/* Top Left: Hammer & Cross (Labor & Faith) */}
      <path d="M 65 65 L 85 75 M 75 60 L 75 85" stroke="#780000" strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="62" width="8" height="6" fill="#780000" rx="1" />

      {/* Top Right: St. Anthony's Lily (Purity) */}
      <path d="M 125 85 Q 120 70 115 65 Q 125 70 125 60 Q 125 70 135 65 Q 130 70 125 85 Z" fill="#780000" />

      {/* Bottom Left: Antique Mountain & Tree */}
      <path d="M 60 135 L 72 118 L 84 135 Z" fill="#f59e0b" opacity="0.6" stroke="#780000" strokeWidth="1.5" />
      <line x1="72" y1="135" x2="72" y2="118" stroke="#780000" strokeWidth="1.5" />

      {/* Bottom Right: Open Holy Bible */}
      <path d="M 115 125 Q 125 120 135 125 L 135 138 Q 125 133 115 138 Z" fill="#f59e0b" opacity="0.6" stroke="#780000" strokeWidth="1.5" />
      <path d="M 135 125 Q 145 120 155 125 L 155 138 Q 145 133 135 138 Z" fill="#f59e0b" opacity="0.6" stroke="#780000" strokeWidth="1.5" />

      {/* Center Banner: RELIGIO ARTIBUS */}
      <rect x="58" y="94" width="84" height="12" fill="#780000" rx="2" />
      <text x="100" y="103" fill="#ffffff" fontSize="7.5" fontWeight="900" letterSpacing="1.5" textAnchor="middle">
        RELIGIO ARTIBUS
      </text>
    </svg>
  );
};
