"use client"

import * as React from 'react';

interface BookSpineProps {
  title: string;
  author: string;
  color?: string;
  height?: string;
  onClick?: () => void;
}

export function BookSpine({
  title,
  author,
  color = '#5D4037',
  height = 'h-64',
  onClick
}: BookSpineProps) {
  const textureOpacity = 0.1 + (title.length % 5) * 0.02;

  return (
    <div
      onClick={onClick}
      className={`relative ${height} w-12 rounded-l-sm rounded-r-md cursor-pointer shadow-md group hover:-translate-x-2 hover:scale-[1.02] hover:z-10 transition-all duration-200`}
      style={{
        backgroundColor: color,
        boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.3), 2px 5px 10px rgba(0,0,0,0.2)'
      }}
    >
      {/* Spine Texture */}
      <div
        className="absolute inset-0 rounded-r-md"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${textureOpacity}'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply'
        }}
      />

      {/* Gold decorative lines */}
      <div className="absolute top-4 left-0 right-0 h-[2px] bg-gold/70 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />
      <div className="absolute top-6 left-0 right-0 h-[1px] bg-gold/50" />
      <div className="absolute bottom-6 left-0 right-0 h-[1px] bg-gold/50" />
      <div className="absolute bottom-4 left-0 right-0 h-[2px] bg-gold/70 shadow-[0_1px_1px_rgba(0,0,0,0.3)]" />

      {/* Vertical Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="whitespace-nowrap font-playfair text-cream text-sm font-bold tracking-wider"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          {title.length > 25 ? title.substring(0, 22) + '...' : title}
        </div>
      </div>

      {/* Author initials */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <span className="text-[10px] font-merriweather text-gold/80 font-bold">
          {author.split(' ').map(n => n[0]).join('')}
        </span>
      </div>
    </div>
  );
}