"use client"

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TexturedCardProps {
  children: React.ReactNode;
  variant?: 'paper' | 'parchment';
  className?: string;
  withTornEdge?: boolean;
}

export function TexturedCard({
  children,
  variant = 'paper',
  className = '',
  withTornEdge = false
}: TexturedCardProps) {
  const bgClass = variant === 'paper' ? 'bg-cream' : 'bg-parchment';
  const bgColor = variant === 'paper' ? '#FFF8E7' : '#E8DCC4';

  return (
    <div
      className={cn(
        'relative rounded-lg p-8 border border-gold/30 shadow-lifted animate-in fade-in slide-in-from-bottom-4 duration-500',
        bgClass,
        className
      )}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`
      }}
    >
      {withTornEdge && (
        <div
          className="absolute -top-3 left-0 right-0 h-4 bg-transparent"
          style={{
            background: `linear-gradient(45deg, transparent 33.333%, ${bgColor} 33.333%, ${bgColor} 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, ${bgColor} 33.333%, ${bgColor} 66.667%, transparent 66.667%)`,
            backgroundSize: '20px 40px',
            backgroundPosition: '0 -20px'
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}