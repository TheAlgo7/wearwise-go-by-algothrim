'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface OneUIChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
}

export function OneUIChip({ active, icon, className, children, ...props }: OneUIChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium',
        'transition-all duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0',
        active
          ? 'bg-teal-400 text-ink-0'
          : 'bg-ink-200 text-fog-300 hover:bg-ink-300 hover:text-fog-100',
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
