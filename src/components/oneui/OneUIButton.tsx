'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface OneUIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?:    'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const OneUIButton = forwardRef<HTMLButtonElement, OneUIButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0',
          'disabled:pointer-events-none disabled:bg-ink-300 disabled:text-fog-600 disabled:opacity-100',
          // size — all meet 44px minimum height
          size === 'sm' && 'h-11 px-4 text-sm rounded-oneui-sm gap-1.5',
          size === 'md' && 'h-11 px-6 text-sm rounded-oneui gap-2',
          size === 'lg' && 'h-14 px-8 text-base rounded-oneui-lg gap-2',
          // variant
          variant === 'primary'   && 'bg-blue-400 text-white hover:bg-blue-500 active:bg-blue-600',
          variant === 'secondary' && 'bg-ink-200 text-fog-100 hover:bg-ink-300 active:bg-ink-400',
          variant === 'ghost'     && 'bg-transparent text-blue-300 hover:bg-blue-400/10 active:bg-blue-400/20',
          variant === 'danger'    && 'bg-red-600/20 text-red-400 hover:bg-red-600/30 active:bg-red-600/40',
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);

OneUIButton.displayName = 'OneUIButton';
