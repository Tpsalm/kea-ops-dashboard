'use client';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'accent';

export function Badge({
  className,
  variant = 'default',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        'cm-badge inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap border',
        variant === 'default' && 'cm-badge-default',
        variant === 'secondary' && 'cm-badge-secondary',
        variant === 'success' && 'cm-badge-success',
        variant === 'warning' && 'cm-badge-warning',
        variant === 'danger' && 'cm-badge-danger',
        variant === 'outline' && 'cm-badge-outline',
        variant === 'accent' && 'cm-badge-accent',
        className
      )}
      {...props}
    />
  );
}
