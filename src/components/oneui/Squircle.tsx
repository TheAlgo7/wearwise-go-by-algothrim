import { cn } from '@/lib/cn';
import { ReactNode } from 'react';

interface SquircleProps {
  size?: number;
  className?: string;
  children?: ReactNode;
}

export function Squircle({ size = 56, className, children }: SquircleProps) {
  return (
    <div
      className={cn('squircle flex items-center justify-center overflow-hidden shrink-0', className)}
      style={{ width: size, height: size }}
    >
      {children}
    </div>
  );
}
