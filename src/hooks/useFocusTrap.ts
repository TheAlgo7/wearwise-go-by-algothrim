'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const el = ref.current;
    const first = el.querySelectorAll<HTMLElement>(FOCUSABLE)[0];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === focusable[0]) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          focusable[0]?.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  return ref;
}
