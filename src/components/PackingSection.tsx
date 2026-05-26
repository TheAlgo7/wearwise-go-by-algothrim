'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/constants';
import type { PackingItem, PackingCategory } from '@/types';

interface PackingSectionProps {
  category: PackingCategory;
  items:    PackingItem[];
  onToggle: (itemId: string, packed: boolean) => void;
}

export function PackingSection({ category, items, onToggle }: PackingSectionProps) {
  const [open, setOpen] = useState(true);

  const packedCount = items.filter(i => i.packed).length;
  const allPacked   = packedCount === items.length;

  return (
    <section aria-labelledby={`section-${category}`} className="bg-ink-100 rounded-oneui-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-ink-200 transition-colors"
        aria-expanded={open}
        aria-controls={`items-${category}`}
      >
        <span className="text-lg" aria-hidden="true">{CATEGORY_ICONS[category]}</span>
        <div className="flex-1 min-w-0">
          <h2 id={`section-${category}`} className="text-sm font-semibold text-fog-100">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <p className="text-xs text-fog-600 mt-0.5">
            {packedCount}/{items.length} packed
          </p>
        </div>
        {allPacked && (
          <span className="text-xs text-teal-400 font-medium mr-1">Done</span>
        )}
        <ChevronDown
          size={16}
          className={cn('text-fog-600 transition-transform duration-200 shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id={`items-${category}`} className="divide-y divide-ink-200" role="list">
          {items.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id, !item.packed)}
                aria-pressed={item.packed}
                aria-label={`${item.name}, quantity ${item.quantity}${item.packed ? ', packed' : ', not packed'}`}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-ink-200 active:bg-ink-300',
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    item.packed
                      ? 'border-teal-400 bg-teal-400'
                      : 'border-ink-500',
                  )}
                  aria-hidden="true"
                >
                  {item.packed && <Check size={11} className="text-ink-0" strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm leading-snug block',
                    item.packed ? 'text-fog-600 line-through' : 'text-fog-100',
                  )}>
                    {item.quantity > 1 ? `${item.quantity}× ` : ''}{item.name}
                  </span>
                  {item.destination_label && (
                    <span className="text-[10px] text-teal-400/70 font-medium uppercase tracking-wide mt-0.5 block">
                      {item.destination_label}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-xs text-fog-700 block mt-0.5">{item.notes}</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
