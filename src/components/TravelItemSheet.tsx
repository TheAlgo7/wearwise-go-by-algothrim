'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Droplets, PackageOpen, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUISheet, OneUIButton } from '@/components/oneui';
import { CATEGORY_LABELS } from '@/lib/constants';
import { getItemDisplay } from '@/lib/item-display';
import { cn } from '@/lib/cn';
import type { TravelItem } from '@/types';

interface Props {
  item: TravelItem | null;
  onClose: () => void;
  /** Called after a successful delete so the list can refetch. */
  onDeleted: () => void;
}

const LAYER_LABELS: Record<string, string> = {
  base: 'Base layer', mid: 'Mid layer', outer: 'Outer layer',
  bottom: 'Bottom', footwear: 'Footwear', accessory: 'Accessory',
};

export function TravelItemSheet({ item, onClose, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    setConfirming(false);
    setError('');
    onClose();
  };

  const remove = async () => {
    if (!item || deleting) return;
    if (!confirming) { setConfirming(true); return; }

    setDeleting(true);
    setError('');
    const supabase = createClient();
    const { error: deleteError } = await supabase.from('travel_items').delete().eq('id', item.id);
    setDeleting(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    close();
    onDeleted();
  };

  if (!item) return null;
  const display = getItemDisplay(item);

  return (
    <OneUISheet open onClose={close} title="Travel item">
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[1.2rem] bg-ink-300">
            {display.image ? (
              <Image src={display.image} alt={item.name} width={144} height={144} className="h-full w-full object-cover" />
            ) : (
              <PackageOpen size={30} className="text-blue-300" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold leading-6 text-fog-100">{display.title}</p>
            {display.brand && (
              <p className="mt-0.5 text-[13px] font-semibold text-blue-300/85">{display.brand}</p>
            )}
            {display.line && (
              <p className="mt-0.5 text-[13px] leading-4 text-fog-500">{display.line}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-blue-400/[0.14] px-3 py-1.5 text-[12px] font-semibold text-blue-200">
            {CATEGORY_LABELS[item.category]}
          </span>
          {item.layer && (
            <span className="rounded-full bg-ink-300 px-3 py-1.5 text-[12px] font-medium text-fog-300">
              {LAYER_LABELS[item.layer] ?? item.layer}
            </span>
          )}
          {item.size_ml != null && (
            <span className="flex items-center gap-1 rounded-full bg-ink-300 px-3 py-1.5 text-[12px] font-medium text-fog-300">
              <Droplets size={12} aria-hidden="true" />
              {item.size_ml} ml
            </span>
          )}
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-ink-300 px-3 py-1.5 text-[12px] font-medium text-fog-500">
              {tag}
            </span>
          ))}
        </div>

        {item.warmth && (
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] text-fog-500">Warmth</span>
            <div className="flex gap-1" aria-label={`Warmth ${item.warmth} of 5`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn('h-2 w-2 rounded-full', i < item.warmth! ? 'bg-blue-400' : 'bg-ink-400')}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-oneui-sm bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {confirming ? (
          <div role="alert" className="flex items-center gap-3 rounded-oneui bg-red-400/10 px-4 py-3">
            <p className="flex-1 text-sm text-red-300">
              Remove from your kit? Future packing lists won&apos;t include it.
            </p>
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="min-h-[44px] shrink-0 px-2 text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
            >
              {deleting ? 'Removing…' : 'Remove'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-[44px] shrink-0 px-2 text-sm text-fog-400 transition-colors hover:text-fog-200"
            >
              Keep
            </button>
          </div>
        ) : (
          <OneUIButton
            type="button"
            variant="danger"
            onClick={remove}
            className="w-full"
          >
            <Trash2 size={16} aria-hidden="true" />
            Remove from kit
          </OneUIButton>
        )}
      </div>
    </OneUISheet>
  );
}
