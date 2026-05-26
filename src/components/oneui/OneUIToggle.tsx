'use client';

import { cn } from '@/lib/cn';

interface OneUIToggleProps {
  checked:     boolean;
  onChange:    (checked: boolean) => void;
  'aria-label'?: string;
  label?:      string;
  disabled?:   boolean;
}

export function OneUIToggle({ checked, onChange, label, disabled, 'aria-label': ariaLabel }: OneUIToggleProps) {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer min-h-[44px]', disabled && 'opacity-40 pointer-events-none')}>
      {label && <span className="text-sm text-fog-200">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-12 h-7 rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0',
          checked ? 'bg-blue-400' : 'bg-ink-400',
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-5 h-5 rounded-full bg-ink-0 shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          )}
        />
      </button>
    </label>
  );
}
