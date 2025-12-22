"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';

interface VintageButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function VintageButton({
  variant = 'primary',
  children,
  className,
  ...props
}: VintageButtonProps) {
  const baseStyles = 'px-8 py-3 rounded-md font-merriweather font-semibold transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-leather text-cream border-2 border-gold shadow-lg hover:bg-leather-light disabled:opacity-50 disabled:cursor-not-allowed',
    secondary: 'bg-cream text-ink border-2 border-leather shadow-md hover:bg-parchment disabled:opacity-50 disabled:cursor-not-allowed'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {/* Texture overlay for button */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}