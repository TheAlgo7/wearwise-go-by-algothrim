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
    <div className={cn('inline-flex min-h-[44px] items-center gap-3', disabled && 'opacity-40 pointer-events-none')}>
      {label && <span className="text-sm text-fog-200">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-8 w-[52px] rounded-full transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0',
          checked ? 'bg-blue-400' : 'bg-ink-500',
        )}
      >
        <span
          className={cn(
            'absolute left-1 top-1 h-6 w-6 rounded-full bg-fog-100 shadow-card transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}
