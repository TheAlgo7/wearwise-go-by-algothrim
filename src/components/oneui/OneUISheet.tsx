'use client';

import { useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-0/72 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        ref={trapRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'relative mx-auto w-full max-w-xl overflow-y-auto rounded-t-[2rem] border-x border-t border-white/[0.07] bg-ink-100 pb-safe shadow-[0_-24px_80px_rgba(0,0,0,0.72)] max-h-[90dvh] animate-slide-up',
          className,
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-ink-400" aria-hidden="true" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 pb-2 pt-1">
            <h2 className="text-[20px] font-semibold leading-7 text-fog-100">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close sheet"
              className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-fog-200 transition-colors hover:bg-white/[0.12]"
            >
              <X size={18} strokeWidth={2.1} />
            </button>
          </div>
        )}

        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
