'use client';

import { useMemo } from 'react';
import { useGameTheme, type GameTheme } from '@/hooks/useGameTheme';

interface ParticleConfig {
  x: string;
  delay: string;
  duration: string;
  size: string;
  opacity: number;
  color?: string;
  hue?: string;
}

/** Different particle counts per theme for variety */
function particleCount(theme: GameTheme): number {
  switch (theme) {
    case 'scroll':
      return 12;
    case 'chakra':
      return 14;
    case 'konoha':
      return 16;
  }
}

/** Chakra nature colors — fire/water/wind/earth/lightning cycling */
const CHAKRA_COLORS = [
  'rgba(6, 182, 212, 0.75)',   // water - cyan
  'rgba(239, 68, 68, 0.65)',   // fire - red
  'rgba(147, 51, 234, 0.7)',   // lightning - purple
  'rgba(6, 182, 212, 0.65)',   // water
  'rgba(34, 197, 94, 0.6)',    // wind - green
  'rgba(249, 115, 22, 0.65)',  // fire alt - orange
  'rgba(180, 130, 50, 0.55)',  // earth - brown/gold
  'rgba(147, 51, 234, 0.65)',  // lightning
  'rgba(6, 182, 212, 0.7)',    // water
  'rgba(239, 68, 68, 0.6)',    // fire
  'rgba(34, 197, 94, 0.65)',   // wind
  'rgba(249, 115, 22, 0.6)',   // fire alt
  'rgba(147, 51, 234, 0.6)',   // lightning
  'rgba(6, 182, 212, 0.65)',   // water
];

/** Konoha leaf hue variations — different shades of green/autumn */
const KONOHA_HUES = [
  '0deg',    // natural green
  '-10deg',  // blue-green
  '15deg',   // warm green
  '30deg',   // yellow-green (autumn)
  '-5deg',   // teal tint
  '0deg',
  '20deg',   // warm
  '-15deg',  // cool
  '10deg',
  '0deg',
  '25deg',   // golden-green
  '-8deg',
  '5deg',
  '0deg',
  '35deg',   // autumn yellow
  '-12deg',
];

function generateParticles(theme: GameTheme): ParticleConfig[] {
  const count = particleCount(theme);
  const particles: ParticleConfig[] = [];

  for (let i = 0; i < count; i++) {
    const base: ParticleConfig = {
      x: `${5 + (i * 90) / count + Math.random() * 6}%`,
      delay: `${i * -1.2 + Math.random() * -3}s`,
      duration: `${7 + Math.random() * 7}s`,
      size: '8px',
      opacity: 0.6,
    };

    switch (theme) {
      case 'scroll':
        // Ink drops — varied sizes, more visible
        base.size = `${4 + Math.random() * 5}px`;
        base.opacity = 0.5 + Math.random() * 0.3;
        base.duration = `${9 + Math.random() * 8}s`;
        break;
      case 'chakra':
        // Energy orbs — varying sizes with vibrant nature colors
        base.size = `${5 + Math.random() * 7}px`;
        base.color = CHAKRA_COLORS[i % CHAKRA_COLORS.length];
        base.opacity = 0.7 + Math.random() * 0.2;
        base.duration = `${6 + Math.random() * 6}s`;
        break;
      case 'konoha':
        // Leaves — varied sizes and hues, slightly more visible
        base.size = `${9 + Math.random() * 6}px`;
        base.hue = KONOHA_HUES[i % KONOHA_HUES.length];
        base.opacity = 0.65 + Math.random() * 0.2;
        base.duration = `${8 + Math.random() * 8}s`;
        break;
    }

    particles.push(base);
  }
  return particles;
}

function particleClass(theme: GameTheme): string {
  switch (theme) {
    case 'scroll':
      return 'theme-scroll-particle';
    case 'chakra':
      return 'theme-chakra-particle';
    case 'konoha':
      return 'theme-konoha-particle';
  }
}

export function ThemeParticles() {
  const { theme } = useGameTheme();
  const particles = useMemo(() => generateParticles(theme), [theme]);
  const className = particleClass(theme);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={`${theme}-${i}`}
          className={className}
          style={{
            '--x': p.x,
            '--delay': p.delay,
            '--duration': p.duration,
            '--size': p.size,
            '--opacity': p.opacity,
            ...(p.color ? { '--particle-color': p.color } : {}),
            ...(p.hue ? { '--hue': p.hue } : {}),
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
