'use client';

import { Check, ChevronDown, FileText, Luggage, Plug, Shirt, Sparkles, Waves } from 'lucide-react';
import { useState, type ElementType } from 'react';
import { cn } from '@/lib/cn';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { PackingItem, PackingCategory } from '@/types';

interface PackingSectionProps {
  category: PackingCategory;
  items: PackingItem[];
  onToggle: (itemId: string, packed: boolean) => void;
}

const CATEGORY_ICONS: Record<PackingCategory, ElementType> = {
  clothing: Shirt,
  grooming: Sparkles,
  electronics: Plug,
  documents: FileText,
  misc: Luggage,
};

export function PackingSection({ category, items, onToggle }: PackingSectionProps) {
  const [open, setOpen] = useState(true);

  const packedCount = items.filter((i) => i.packed).length;
  const allPacked = packedCount === items.length;
  const Icon = CATEGORY_ICONS[category] ?? Waves;

  return (
    <section aria-labelledby={`section-${category}`} className="bg-ink-200 border border-white/[0.06] rounded-[1.65rem] overflow-hidden shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-ink-300 transition-colors"
        aria-expanded={open}
        aria-controls={`items-${category}`}
      >
        <span className="h-9 w-9 rounded-full bg-blue-400/10 flex items-center justify-center" aria-hidden="true">
          <Icon size={17} className="text-blue-300" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 id={`section-${category}`} className="text-sm font-semibold text-fog-100">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <p className="text-xs text-fog-600 mt-0.5">
            {packedCount}/{items.length} packed
          </p>
        </div>
        {allPacked && (
          <span className="text-xs text-blue-300 font-medium mr-1">Done</span>
        )}
        <ChevronDown
          size={16}
          className={cn('text-fog-600 transition-transform duration-200 shrink-0', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul id={`items-${category}`} className="divide-y divide-white/[0.06]" role="list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id, !item.packed)}
                aria-pressed={item.packed}
                aria-label={`${item.name}, quantity ${item.quantity}${item.packed ? ', packed' : ', not packed'}`}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ink-300 active:bg-ink-400"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                    item.packed
                      ? 'border-blue-400 bg-blue-400'
                      : 'border-ink-500',
                  )}
                  aria-hidden="true"
                >
                  {item.packed && <Check size={11} className="text-white" strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className={cn(
                    'text-sm leading-snug block',
                    item.packed ? 'text-fog-600 line-through' : 'text-fog-100',
                  )}>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                  </span>
                  {item.destination_label && (
                    <span className="text-[10px] text-blue-300/75 font-medium uppercase tracking-wide mt-0.5 block">
                      {item.destination_label}
                    </span>
                  )}
                  {item.notes && (
                    <span className="text-xs text-fog-600 block mt-0.5">{item.notes}</span>
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
