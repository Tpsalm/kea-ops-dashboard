'use client';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

/**
 * Haikei-style animated backgrounds: organic blurred blobs and layered waves.
 * `variant` picks a preset; `className` positions/sizes the container.
 */

type MeshProps = {
  variant?: 'blobs' | 'waves' | 'morph';
  className?: string;
  style?: React.CSSProperties;
  colors?: string[];
  opacity?: number;
};

const PALETTES = {
  teal: ['#0d9488', '#07535a', '#14b8a6', '#134e4a'],
  amber: ['#f59e0b', '#ea580c', '#fbbf24', '#9a3412'],
  emerald: ['#16a34a', '#059669', '#4ade80', '#166534'],
  blue: ['#2563eb', '#0ea5e9', '#3b82f6', '#1e3a8a'],
  mixed: ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'],
};

const EASE = [0.22, 1, 0.36, 1] as const;

function Blob({ id, cx, cy, scale, color }: { id: string; cx: string; cy: string; scale: number; color: string }) {
  return (
    <motion.div
      className="absolute"
      style={{ left: cx, top: cy, width: 220, height: 220, transform: `scale(${scale})` }}
      initial={{ x: 0, y: 0, rotate: 0 }}
      animate={{ x: [0, 26, -14, 0], y: [0, -20, 16, 0], rotate: [0, 10, -8, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg viewBox="0 0 200 200" width="220" height="220">
        <defs>
          <filter id={id} x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" result="noise" />
            <feGaussianBlur stdDeviation="22" in="noise" result="blur" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="70" fill={color} filter={`url(#${id})`} opacity="0.5" />
      </svg>
    </motion.div>
  );
}

function Waves({ colors, opacity }: { colors: string[]; opacity: number }) {
  const wave = (i: number) =>
    `M0,${90 + i * 14} C180,${40 + i * 16} 360,${150 - i * 12} 540,${98 + i * 12} C720,${40} 900,${160} 1080,${104} C1260,${54} 1380,${140} 1440,${94} L1440,220 L0,220 Z`;
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity }}>
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 180" preserveAspectRatio="none" style={{ height: '70%' }}>
        {colors.map((color, i) => (
          <motion.path
            key={i}
            d={wave(i)}
            fill={color}
            opacity={0.5 - i * 0.12}
            animate={{ d: [wave(i), `M0,${102 + i * 14} C200,${62 + i * 16} 340,${132 - i * 12} 540,${112 + i * 12} C740,${64} 900,${140} 1080,${118} C1260,${76} 1380,${120} 1440,${106} L1440,220 L0,220 Z`, wave(i)] }}
            transition={{ duration: 18 - i * 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

export function HaikeiBackground({ variant = 'blobs', className, style, colors, opacity = 1 }: MeshProps) {
  const palette = colors ?? PALETTES.teal;
  return (
    <div aria-hidden className={cn('kea-haikei absolute inset-0 pointer-events-none overflow-hidden', className)} style={{ opacity, ...style }}>
      {variant === 'blobs' && (
        <>
          <Blob id="kea-blob-a" cx="-6%" cy="-8%" scale={1.1} color={palette[0]} />
          <Blob id="kea-blob-b" cx="58%" cy="6%" scale={0.75} color={palette[1]} />
          <Blob id="kea-blob-c" cx="28%" cy="62%" scale={0.9} color={palette[2]} />
        </>
      )}
      {variant === 'waves' && <Waves colors={palette} opacity={opacity} />}
      {variant === 'morph' && (
        <>
          <Blob id="kea-blob-d" cx="-8%" cy="-12%" scale={1.4} color={palette[0]} />
          <Blob id="kea-blob-e" cx="66%" cy="22%" scale={1.1} color={palette[2]} />
          <div className="absolute bottom-0 left-0 w-full h-1/2" style={{ background: palette[3], opacity: 0.35, filter: 'blur(34px)' }} />
        </>
      )}
    </div>
  );
}
