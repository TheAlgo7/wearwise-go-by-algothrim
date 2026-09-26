'use client';

import { cn } from '@/lib/cn';
import { Delete } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const PIN_LENGTH = 4;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

/** The same keypad as WearWise Wardrobe, in Go's blue. */
export default function UnlockPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const submitting = useRef(false);

  const submit = useCallback(
    async (value: string) => {
      if (submitting.current) return;
      submitting.current = true;
      setBusy(true);
      setError(false);

      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      }).catch(() => null);

      if (res?.ok) {
        setWelcome(true);
        setTimeout(() => {
          router.replace('/');
          router.refresh();
        }, 620);
        return;
      }

      setError(true);
      setPin('');
      setBusy(false);
      submitting.current = false;
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(140);
    },
    [router]
  );

  const push = useCallback(
    (digit: string) => {
      if (busy) return;
      setError(false);
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev;
        const next = prev + digit;
        if (next.length === PIN_LENGTH) void submit(next);
        return next;
      });
    },
    [busy, submit]
  );

  // Hardware keyboard support, for when the app is open on a laptop.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) push(e.key);
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [push]);

  if (welcome) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2">
        <p className="text-[26px] font-semibold text-fog-100">Welcome back</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-8 pb-10">
      <p className="text-[15px] font-semibold uppercase tracking-[0.32em] text-fog-100">WearWise Go</p>

      <p className="mt-3 text-[15px] text-fog-300" aria-live="polite">
        {error ? 'That is not it. Try again.' : 'Enter your PIN'}
      </p>

      <div className="mt-7 flex items-center gap-4" role="status" aria-label={`${pin.length} of ${PIN_LENGTH} digits entered`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 w-3 rounded-full transition-all duration-200',
              i < pin.length ? 'scale-110 bg-blue-400' : 'bg-white/[0.14]',
              error && 'bg-amber-400'
            )}
          />
        ))}
      </div>

      <div className="mt-12 grid w-full max-w-[300px] grid-cols-3 gap-x-6 gap-y-4">
        {KEYS.map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : k === 'del' ? (
            <button
              key={i}
              type="button"
              onClick={() => setPin((p) => p.slice(0, -1))}
              disabled={busy}
              aria-label="Delete last digit"
              className="press mx-auto flex h-16 w-16 items-center justify-center rounded-full text-fog-300 transition-colors active:bg-white/[0.06] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <Delete size={22} aria-hidden />
            </button>
          ) : (
            <button
              key={i}
              type="button"
              onClick={() => push(k)}
              disabled={busy}
              className="press mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05] text-[24px] font-medium text-fog-100 transition-colors active:bg-blue-400/20 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              {k}
            </button>
          )
        )}
      </div>
    </main>
  );
}
