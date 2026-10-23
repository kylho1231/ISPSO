'use client';

import React from 'react';

interface SacSealProps {
  className?: string;
  size?: number;
}

export const SacSeal: React.FC<SacSealProps> = ({ className = 'h-16 w-16', size = 64 }) => {
  return (
    <img
      src="/sac-logo.png"
      alt="St. Anthony's College Official Seal"
      width={size}
      height={size}
      className={`rounded-full object-contain drop-shadow-sm select-none ${className}`}
    />
  );
};
