'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PackingItem } from '@/types';

interface GroupProps {
  id: string;
  title: string;
  /** One line under the title, for groups that need explaining (Pack last). */
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'critical' | 'normal';
  items: PackingItem[];
  /** Ids mid-way through sliding out after being ticked. */
  leaving: Set<string>;
  onToggle: (item: PackingItem) => void;
  onOpen: (item: PackingItem) => void;
  /** Present only where adding makes sense (the To pack view). */
  onAdd?: (name: string) => Promise<void>;
  addLabel?: string;
  /** Render even with no items (so the Add row is reachable). */
  showEmpty?: boolean;
  /** One-stop trips: every row would repeat the same city, so leave it off. */
  singleStop?: boolean;
}

/**
 * One section of the list: a heading, a grouped surface of rows, and a way to
 * add something the engine missed without leaving the screen.
 *
 * The old sections were cards with a chevron to collapse, a "3/7 packed"
 * caption and every row a single tap target that toggled the tick. There was
 * no way to add a thing, fix a quantity or drop a suggestion, which is why the
 * one real trip's list had to be written straight into the database.
 */
export function PackingGroup({
  id, title, hint, icon, tone = 'normal', items, leaving, onToggle, onOpen, onAdd, addLabel, showEmpty, singleStop,
}: GroupProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  if (items.length === 0 && !showEmpty) return null;

  const submit = async () => {
    const name = draft.trim();
    if (!name || !onAdd || saving) return;
    setSaving(true);
    try {
      await onAdd(name);
      setDraft('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby={`group-${id}`} className="animate-fade-in">
      <div className="mb-2 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          <h2
            id={`group-${id}`}
            className={cn('flex items-center gap-2 text-[15px] font-semibold leading-5', tone === 'critical' ? 'text-amber-300' : 'text-fog-100')}
          >
            {icon}
            {title}
          </h2>
          {hint && <p className="mt-0.5 text-[12px] leading-4 text-fog-400">{hint}</p>}
        </div>
        <span className="section-meta shrink-0">{items.length}</span>
      </div>

      <ul className="group-list divide-y divide-white/[0.06]" role="list">
        {items.map((item) => (
          <PackingRow
            key={item.id}
            item={item}
            tone={tone === 'critical' || item.priority === 'critical' ? 'critical' : 'normal'}
            leaving={leaving.has(item.id)}
            singleStop={singleStop}
            onToggle={() => onToggle(item)}
            onOpen={() => onOpen(item)}
          />
        ))}

        {onAdd && (
          <li>
            {adding ? (
              <form
                className="flex items-center gap-2 px-3 py-2"
                onSubmit={(e) => { e.preventDefault(); void submit(); }}
              >
                <label htmlFor={`add-${id}`} className="sr-only">{addLabel ?? `Add to ${title}`}</label>
                <input
                  id={`add-${id}`}
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => { if (!draft.trim()) setAdding(false); }}
                  placeholder="Name it, then Enter"
                  enterKeyHint="done"
                  className="field h-11 min-w-0 flex-1 rounded-full"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || saving}
                  className="press h-11 shrink-0 rounded-full bg-blue-400 px-4 text-[14px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 disabled:bg-white/[0.07] disabled:text-fog-500"
                >
                  Add
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="press flex min-h-[52px] w-full items-center gap-3 px-4 text-left text-[14px] font-semibold text-fog-300 transition-colors hover:bg-white/[0.03] hover:text-fog-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
              >
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border border-dashed border-fog-500 text-fog-400">
                  <Plus size={13} strokeWidth={2.4} aria-hidden />
                </span>
                {addLabel ?? `Add to ${title.toLowerCase()}`}
              </button>
            )}
          </li>
        )}
      </ul>
    </section>
  );
}

function PackingRow({
  item, tone, leaving, singleStop, onToggle, onOpen,
}: {
  item: PackingItem;
  tone: 'critical' | 'normal';
  leaving: boolean;
  singleStop?: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const checked = item.packed || leaving;
  const sub = [singleStop ? null : item.destination_label, item.notes].filter(Boolean).join(' · ');

  return (
    <li
      className="flex items-stretch"
      style={leaving ? { animation: 'row-out 260ms var(--ease-spring) forwards' } : undefined}
    >
      {/* The tick. Its own 56px column, so ticking fast down a list never opens an item by accident. */}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={item.packed}
        aria-label={`${item.name}${item.quantity > 1 ? `, ${item.quantity}` : ''}. ${item.packed ? 'Packed' : 'Not packed'}`}
        className="press flex w-14 shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
      >
        <span
          className={cn(
            'flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 transition-colors duration-200',
            checked
              ? tone === 'critical' ? 'border-amber-400 bg-amber-400' : 'border-blue-400 bg-blue-400'
              : tone === 'critical' ? 'border-amber-400/60' : 'border-fog-500',
          )}
          aria-hidden
        >
          {checked && <Check size={13} strokeWidth={3} className="text-ink-0 animate-scale-in" />}
        </span>
      </button>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit ${item.name}`}
        className="press flex min-h-[58px] min-w-0 flex-1 items-center gap-3 py-2.5 pr-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
      >
        {item.image_url && (
          <span className="photo-well relative h-11 w-11 shrink-0 overflow-hidden rounded-[12px]">
            <Image src={item.image_url} alt="" fill sizes="44px" className="object-contain" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className={cn('block text-[15px] leading-5 transition-colors', item.packed ? 'text-fog-400 line-through decoration-fog-500' : 'text-fog-100')}>
            {item.name}
            {item.quantity > 1 && <span className="ml-1.5 text-[13px] font-semibold tabular-nums text-fog-400">×{item.quantity}</span>}
          </span>
          {sub && <span className="mt-0.5 block text-[12px] leading-4 text-fog-400 text-pretty">{sub}</span>}
        </span>
      </button>
    </li>
  );
}
