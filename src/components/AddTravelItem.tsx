'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUISheet, OneUIButton } from '@/components/oneui';
import { CATEGORY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/cn';
import type { PackingCategory, ClothingLayer, WarmthRating } from '@/types';

const CATEGORIES: PackingCategory[] = ['clothing', 'grooming', 'electronics', 'documents', 'misc'];
const LAYERS: ClothingLayer[] = ['base', 'mid', 'outer', 'bottom', 'footwear', 'accessory'];
const LAYER_LABELS: Record<ClothingLayer, string> = {
  base: 'Base', mid: 'Mid', outer: 'Outer', bottom: 'Bottom', footwear: 'Footwear', accessory: 'Accessory',
};

interface Props {
  /** 'header' = compact pill for the page header; 'cta' = full-width button for empty state. */
  variant?: 'header' | 'cta';
  /** Called after a successful insert so a client-rendered list can refetch. */
  onAdded?: () => void;
}

export function AddTravelItem({ variant = 'header', onAdded }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<PackingCategory>('clothing');
  const [layer, setLayer] = useState<ClothingLayer | null>('base');
  const [warmth, setWarmth] = useState<WarmthRating | null>(null);
  const [sizeMl, setSizeMl] = useState('');
  const [tags, setTags] = useState('');

  const isClothing = category === 'clothing';

  const reset = () => {
    setName(''); setCategory('clothing'); setLayer('base');
    setWarmth(null); setSizeMl(''); setTags(''); setError('');
  };

  const openSheet = () => { reset(); setOpen(true); };

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const parsedMl = sizeMl.trim() ? Math.max(0, parseInt(sizeMl, 10) || 0) : null;

    const insert = {
      name: name.trim(),
      category,
      is_clothing: isClothing,
      layer: isClothing ? layer : null,
      warmth: isClothing ? warmth : null,
      size_ml: category === 'grooming' ? parsedMl : null,
      tags: parsedTags,
    };

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from('travel_items').insert(insert);
      if (insertError) throw new Error(insertError.message);
      setOpen(false);
      onAdded?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save item');
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
          aria-label="Add travel item"
          className={cn(
            'flex h-10 items-center gap-1.5 rounded-full bg-blue-400/[0.14] pl-2.5 pr-3.5 text-[13px] font-semibold text-blue-200',
            'transition-colors hover:bg-blue-400/20 active:scale-[0.97]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
          )}
        >
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Add
        </button>
      ) : (
        <OneUIButton onClick={openSheet} className="w-full">
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
          Add your first item
        </OneUIButton>
      )}

      <OneUISheet open={open} onClose={() => setOpen(false)} title="Add travel item">
        <div className="space-y-5">
          {/* Name */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-fog-500">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Linen shirt, Sunscreen SPF50"
              autoFocus
              className="h-12 w-full rounded-oneui bg-ink-300 px-4 text-[15px] text-fog-100 placeholder:text-fog-500 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          {/* Category */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-fog-500">Category</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat}
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'flex min-h-[44px] items-center rounded-full px-3.5 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
                    category === cat
                      ? 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/45'
                      : 'bg-ink-300 text-fog-500 hover:bg-ink-400 hover:text-fog-200',
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Clothing-only: layer + warmth */}
          {isClothing && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-medium text-fog-500">Layer</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Clothing layer">
                  {LAYERS.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={layer === l}
                      onClick={() => setLayer(l)}
                      className={cn(
                        'flex min-h-[44px] items-center rounded-full px-3.5 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
                        layer === l
                          ? 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/45'
                          : 'bg-ink-300 text-fog-500 hover:bg-ink-400 hover:text-fog-200',
                      )}
                    >
                      {LAYER_LABELS[l]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-fog-500">Warmth <span className="text-fog-600">(optional)</span></p>
                <div className="flex gap-1.5" role="group" aria-label="Warmth rating">
                  {([1, 2, 3, 4, 5] as WarmthRating[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      aria-pressed={warmth === w}
                      onClick={() => setWarmth(warmth === w ? null : w)}
                      className={cn(
                        'h-11 flex-1 rounded-oneui-sm text-sm font-semibold tabular-nums transition-all duration-200 active:scale-[0.97]',
                        warmth !== null && w <= warmth
                          ? 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/45'
                          : 'bg-ink-300 text-fog-500 hover:bg-ink-400',
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Grooming-only: liquid volume */}
          {category === 'grooming' && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-fog-500">
                Liquid volume in ml <span className="text-fog-600">(optional — flags carry-on limit)</span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={sizeMl}
                min={0}
                onChange={(e) => setSizeMl(e.target.value)}
                placeholder="e.g. 100"
                className="h-12 w-full rounded-oneui bg-ink-300 px-4 text-[15px] text-fog-100 placeholder:text-fog-500 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </label>
          )}

          {/* Tags */}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-fog-500">Tags <span className="text-fog-600">(optional, comma-separated)</span></span>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. hygiene, liquid"
              className="h-12 w-full rounded-oneui bg-ink-300 px-4 text-[15px] text-fog-100 placeholder:text-fog-500 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-oneui-sm bg-red-400/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <OneUIButton
            type="button"
            size="lg"
            loading={saving}
            disabled={!name.trim()}
            onClick={submit}
            className="w-full"
          >
            {saving ? 'Saving…' : 'Add to kit'}
          </OneUIButton>
        </div>
      </OneUISheet>
    </>
  );
}
