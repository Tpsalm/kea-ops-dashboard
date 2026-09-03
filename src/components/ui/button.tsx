'use client';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      className={cn(
        'cm-btn inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
        'cm-btn-sm',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-base',
        size === 'icon' && 'h-10 w-10',
        variant === 'primary' && 'cm-btn-primary',
        variant === 'secondary' && 'cm-btn-secondary',
        variant === 'ghost' && 'cm-btn-ghost',
        variant === 'outline' && 'cm-btn-outline',
        variant === 'danger' && 'cm-btn-danger',
        variant === 'accent' && 'cm-btn-accent',
        className
      )}
      {...props}
    />
  );
}
