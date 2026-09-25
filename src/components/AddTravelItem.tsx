'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUISheet } from '@/components/oneui';
import { CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { PackingCategory } from '@/types';

type GearCategory = Exclude<PackingCategory, 'clothing'>;
const CATEGORIES: GearCategory[] = ['grooming', 'electronics', 'documents', 'misc'];

interface Props {
  /** 'header' = compact pill for the page header; 'cta' = full-width button for empty state. */
  variant?: 'header' | 'cta';
  /** Called after a successful insert so a client-rendered list can refetch. */
  onAdded?: () => void;
}

/**
 * Add a piece of gear.
 *
 * Clothing is gone from here on purpose: Go reads clothes from the Wardrobe,
 * so a shirt added in Go would be a second, disconnected copy. Layer and
 * warmth went with it; what is left is a name, a section, and for grooming
 * the bottle size that decides the carry-on warning.
 */
export function AddTravelItem({ variant = 'header', onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<GearCategory>('grooming');
  const [sizeMl, setSizeMl] = useState('');
  const [tags, setTags] = useState('');

  const openSheet = () => {
    setName(''); setCategory('grooming'); setSizeMl(''); setTags(''); setError('');
    setOpen(true);
  };

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');

    const parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const parsedMl = sizeMl.trim() ? Math.max(0, parseInt(sizeMl, 10) || 0) : null;

    try {
      const { error: insertError } = await createClient().from('travel_items').insert({
        name: name.trim(),
        category,
        is_clothing: false,
        layer: null,
        warmth: null,
        size_ml: category === 'grooming' ? parsedMl : null,
        tags: parsedTags,
      });
      if (insertError) throw new Error(insertError.message);
      setOpen(false);
      onAdded?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save that');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={openSheet}
          aria-label="Add gear"
          className="press flex h-11 items-center gap-1.5 rounded-full bg-white/[0.08] pl-3 pr-4 text-[14px] font-semibold text-fog-100 transition-colors hover:bg-white/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          <Plus size={17} strokeWidth={2.4} aria-hidden />
          Add
        </button>
      ) : (
        <button
          type="button"
          onClick={openSheet}
          className="press flex h-12 items-center justify-center gap-2 rounded-full bg-blue-400 px-6 text-[15px] font-semibold text-ink-0 transition-colors hover:bg-blue-300"
        >
          <Plus size={17} strokeWidth={2.4} aria-hidden />
          Add your first thing
        </button>
      )}

      <OneUISheet open={open} onClose={() => setOpen(false)} title="Add gear">
        <div className="space-y-5">
          <label className="block space-y-1.5" htmlFor="gear-name">
            <span className="px-1 text-[13px] font-medium text-fog-300">Name</span>
            <input
              id="gear-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Beardo Hair Clay Wax, USB-C cable"
              autoFocus
              className="field"
            />
          </label>

          <div className="space-y-2">
            <p className="px-1 text-[13px] font-medium text-fog-300">Section</p>
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Section">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" role="radio" aria-checked={category === cat} onClick={() => setCategory(cat)} className="chip">
                  {cat === 'misc' ? 'Other' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {category === 'grooming' && (
            <label className="block space-y-1.5" htmlFor="gear-ml">
              <span className="px-1 text-[13px] font-medium text-fog-300">
                Bottle size in ml <span className="text-fog-400">(for the 100ml cabin rule)</span>
              </span>
              <input
                id="gear-ml"
                type="number"
                inputMode="numeric"
                value={sizeMl}
                min={0}
                onChange={(e) => setSizeMl(e.target.value)}
                placeholder="50"
                className="field"
              />
            </label>
          )}

          <label className="block space-y-1.5" htmlFor="gear-tags">
            <span className="px-1 text-[13px] font-medium text-fog-300">
              Tags <span className="text-fog-400">(optional, comma-separated; &ldquo;work&rdquo; packs it for work trips only)</span>
            </span>
            <input
              id="gear-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="liquid, work"
              className="field"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-oneui-sm bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}

          <button
            type="button"
            disabled={!name.trim() || saving}
            onClick={() => void submit()}
            className={cn(
              'press flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16px] font-semibold transition-colors',
              'bg-blue-400 text-ink-0 hover:bg-blue-300 disabled:bg-white/[0.07] disabled:text-fog-500',
            )}
          >
            {saving && <Loader2 size={18} className="animate-spin" aria-hidden />}
            {saving ? 'Saving' : 'Add to gear'}
          </button>
        </div>
      </OneUISheet>
    </>
  );
}
