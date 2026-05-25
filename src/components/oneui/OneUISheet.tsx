'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface OneUISheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function OneUISheet({ open, onClose, title, children, className }: OneUISheetProps) {
  const trapRef = useFocusTrap(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-0/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={trapRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'relative bg-ink-100 rounded-t-oneui-xl pb-safe max-h-[90dvh] overflow-y-auto animate-slide-up',
          className,
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-ink-400" aria-hidden="true" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-ink-200">
            <h2 className="text-base font-semibold text-fog-100">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close sheet"
              className="p-1.5 rounded-full hover:bg-ink-300 transition-colors text-fog-500"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
