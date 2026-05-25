import { cn } from '@/lib/cn';
import { ReactNode } from 'react';

interface OneUIHeaderProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function OneUIHeader({ title, subtitle, left, right, className }: OneUIHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex items-center gap-3 px-4 pt-safe bg-ink-0/90 backdrop-blur-md border-b border-ink-200',
        subtitle ? 'py-3' : 'py-4',
        className,
      )}
    >
      {left && <div className="shrink-0">{left}</div>}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-fog-100 truncate leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-fog-500 truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}
