'use client';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { HaikeiBackground } from './haikei-background';
import { Badge } from './ui/badge';

const EASE = [0.22, 1, 0.36, 1] as const;

export type FieldHeroProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  badge?: string;
  variant?: 'blobs' | 'waves' | 'morph';
  colors?: string[];
  actions?: ReactNode;
  stat?: ReactNode;
};

export function FieldHero({
  eyebrow,
  title,
  subtitle,
  badge,
  variant = 'blobs',
  colors,
  actions,
  stat,
}: FieldHeroProps) {
  return (
    <motion.div
      className="kea-hero relative overflow-hidden rounded-2xl border"
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: EASE }}
      style={{
        background: 'linear-gradient(120deg, var(--card) 0%, var(--soft) 55%, rgba(13,148,136,0.06) 100%)',
        borderColor: 'var(--line)',
        boxShadow: '0 8px 30px rgba(0,0,0,.06)',
        padding: '26px 28px',
        display: 'grid',
        gap: 14,
        position: 'relative',
        isolation: 'isolate',
      }}
    >
      <HaikeiBackground variant={variant} colors={colors} className="opacity-[0.5]" />
      <div className="relative" style={{ zIndex: 1, display: 'grid', gap: 10 }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <i className="live-dot live" />
            {eyebrow}
          </span>
          {badge && <Badge variant="accent">{badge}</Badge>}
        </div>
        <h2 style={{ margin: 0, fontSize: 26, letterSpacing: '-.03em', lineHeight: 1.15 }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', maxWidth: 640 }}>{subtitle}</p>
        {(actions || stat) && (
          <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: 4 }}>
            {actions}
            {stat}
          </div>
        )}
      </div>
    </motion.div>
  );
}
