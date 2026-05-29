'use client';

import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PackingItem } from '@/types';

interface CriticalSectionProps {
  items:    PackingItem[];
  onToggle: (itemId: string, packed: boolean) => void;
}

export function CriticalSection({ items, onToggle }: CriticalSectionProps) {
  if (items.length === 0) return null;

  const packedCount = items.filter(i => i.packed).length;
  const allPacked   = packedCount === items.length;

  return (
    <section aria-labelledby="section-critical" className="overflow-hidden rounded-[1.65rem] border border-amber-500/20 bg-ink-200 shadow-card">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/[0.10]" aria-hidden="true">
          <AlertTriangle size={17} className="text-amber-400" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 id="section-critical" className="text-sm font-semibold text-amber-400">
            Don&apos;t forget
          </h2>
          <p className="mt-0.5 text-xs text-fog-600">
            {allPacked ? 'All checked' : `${packedCount}/${items.length} checked`}
          </p>
        </div>
        {allPacked && (
          <span className="text-xs text-amber-400 font-medium">Done</span>
        )}
      </div>

      <ul className="divide-y divide-white/[0.06]" role="list">
        {items.map(item => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onToggle(item.id, !item.packed)}
              aria-pressed={item.packed}
              aria-label={`${item.name}${item.quantity > 1 ? `, quantity ${item.quantity}` : ''}${item.packed ? ', checked' : ', not checked'}`}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                'hover:bg-ink-300 active:bg-ink-400',
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                  item.packed
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-amber-500/35',
                )}
                aria-hidden="true"
              >
                {item.packed && <Check size={11} className="text-white" strokeWidth={3} />}
              </div>

              <div className="flex-1 min-w-0">
                <span className={cn(
                  'text-sm leading-snug block font-medium',
                  item.packed ? 'text-fog-600 line-through' : 'text-fog-100',
                )}>
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                </span>
                {item.destination_label && (
                  <span className="text-[10px] text-amber-400/70 font-medium uppercase tracking-wide mt-0.5 block">
                    {item.destination_label}
                  </span>
                )}
                {item.notes && (
                  <span className="text-xs text-fog-500 block mt-0.5">{item.notes}</span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
