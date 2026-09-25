'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { OneUISheet, OneUIToggle } from '@/components/oneui';
import { CATEGORY_LABELS } from '@/lib/constants';
import type { PackingCategory, PackingItem } from '@/types';

const CATEGORIES: PackingCategory[] = ['clothing', 'grooming', 'electronics', 'documents', 'misc'];

export interface ItemPatch {
  name: string;
  quantity: number;
  notes: string | null;
  pack_last: boolean;
  category: PackingCategory;
}

interface Props {
  item: PackingItem | null;
  onClose: () => void;
  onSave: (item: PackingItem, patch: ItemPatch) => Promise<void>;
  onRemove: (item: PackingItem) => Promise<void>;
}

/**
 * Everything about one thing on the list.
 *
 * The real Ahmedabad notes read like "PACKED in laptop bag", "MORNING: add
 * after brushing", "Use the 50ml one". None of that could be written in the
 * app; now a note, a quantity and "pack last" are all one tap from any row.
 */
export function ItemSheet({ item, onClose, onSave, onRemove }: Props) {
  return (
    <OneUISheet open={item !== null} onClose={onClose} title="Item">
      {item && <ItemForm key={item.id} item={item} onSave={onSave} onRemove={onRemove} onClose={onClose} />}
    </OneUISheet>
  );
}

function ItemForm({ item, onSave, onRemove, onClose }: { item: PackingItem } & Omit<Props, 'item'>) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [packLast, setPackLast] = useState(item.pack_last ?? false);
  const [category, setCategory] = useState<PackingCategory>(item.category);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await onSave(item, { name: name.trim(), quantity, notes: notes.trim() || null, pack_last: packLast, category });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that');
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirmRemove) { setConfirmRemove(true); return; }
    setBusy(true);
    try {
      await onRemove(item);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove that');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-1">
      {item.image_url && (
        <div className="photo-well relative mx-auto h-36 w-36 overflow-hidden rounded-[1.5rem]">
          <Image src={item.image_url} alt={item.name} fill sizes="144px" className="object-contain" />
        </div>
      )}

      <label className="block space-y-1.5" htmlFor="item-name">
        <span className="px-1 text-[13px] font-medium text-fog-300">Name</span>
        <input id="item-name" value={name} onChange={(e) => setName(e.target.value)} className="field" />
      </label>

      <div className="flex items-center justify-between gap-4 px-1">
        <span className="text-[15px] font-semibold text-fog-100">How many</span>
        <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="One fewer"
            className="press flex h-10 w-10 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.08] disabled:text-fog-600"
          >
            <Minus size={16} aria-hidden />
          </button>
          <span className="w-8 text-center text-[16px] font-semibold tabular-nums text-fog-100" aria-live="polite">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(30, q + 1))}
            aria-label="One more"
            className="press flex h-10 w-10 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.08]"
          >
            <Plus size={16} aria-hidden />
          </button>
        </div>
      </div>

      <label className="block space-y-1.5" htmlFor="item-note">
        <span className="px-1 text-[13px] font-medium text-fog-300">Note</span>
        <input
          id="item-note"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Laptop bag, wear it on the way, the 50ml one"
          className="field"
        />
      </label>

      <div className="flex min-h-[56px] items-center justify-between gap-4 rounded-[1.25rem] bg-white/[0.04] px-4">
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-fog-100">Pack last</span>
          <span className="block text-[12px] text-fog-400">You still use it the morning you leave</span>
        </span>
        <OneUIToggle checked={packLast} onChange={setPackLast} aria-label="Pack last" />
      </div>

      <div>
        <p className="mb-2 px-1 text-[13px] font-medium text-fog-300">Section</p>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Section">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              onClick={() => setCategory(c)}
              className="chip"
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {error && <p role="alert" className="rounded-oneui-sm bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className={`press flex h-14 shrink-0 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors ${confirmRemove ? 'bg-red-500/20 text-red-300' : 'bg-white/[0.06] text-fog-200 hover:bg-white/[0.1]'}`}
        >
          <Trash2 size={16} aria-hidden />
          {confirmRemove ? 'Tap to confirm' : 'Remove'}
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !name.trim()}
          className="press flex h-14 flex-1 items-center justify-center rounded-full bg-blue-400 text-[16px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 disabled:bg-white/[0.07] disabled:text-fog-500"
        >
          Save
        </button>
      </div>
    </div>
  );
}
