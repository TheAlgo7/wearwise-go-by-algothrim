'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Luggage, PackageOpen, Plug, Shirt, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { OneUIHeader } from '@/components/oneui';
import { AddTravelItem } from '@/components/AddTravelItem';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/constants';
import { getItemDisplay } from '@/lib/item-display';
import type { TravelItem, PackingCategory } from '@/types';

type NormalCategory = Exclude<(typeof CATEGORY_ORDER)[number], 'critical'>;

const CATEGORY_ICONS: Record<NormalCategory, ElementType> = {
  clothing: Shirt,
  grooming: Sparkles,
  electronics: Plug,
  documents: FileText,
  misc: Luggage,
};

export default function ItemsPage() {
  // null = loading (renders skeletons); [] = loaded, empty.
  const [items, setItems] = useState<TravelItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('travel_items').select('*').order('name');
    setLoadError(Boolean(error));
    setItems(error ? [] : ((data ?? []) as TravelItem[]));
  }, []);

  // load() sets state only after an awaited fetch (not synchronous) — same pattern as /trips/[id].
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const loading = items === null;
  const list = items ?? [];
  const normalCategories = CATEGORY_ORDER.filter((c): c is NormalCategory => c !== 'critical');

  const byCategory = normalCategories.reduce<Record<PackingCategory, TravelItem[]>>(
    (acc, cat) => {
      acc[cat] = list.filter((i) => i.category === cat);
      return acc;
    },
    { clothing: [], grooming: [], electronics: [], documents: [], misc: [] },
  );

  return (
    <>
      <OneUIHeader
        title="Travel items"
        subtitle={loading ? 'Your kit' : `${list.length} item${list.length !== 1 ? 's' : ''} in your kit`}
        right={<AddTravelItem onAdded={load} />}
      />

      <div className="px-4 pt-3 pb-8 space-y-6">
        {loading ? (
          <ItemsSkeleton />
        ) : loadError ? (
          <div role="alert" className="rounded-[1.65rem] bg-ink-100 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-5 text-fog-100">Couldn&apos;t load your kit</p>
                <p className="mt-1 text-[13px] leading-5 text-fog-500">Check your connection and try again.</p>
              </div>
              <button
                type="button"
                onClick={() => { setItems(null); load(); }}
                className="min-h-[44px] shrink-0 rounded-full bg-blue-400/[0.14] px-5 text-[13px] font-semibold text-blue-200 transition-colors hover:bg-blue-400/[0.22]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-[2rem] border border-white/[0.07] bg-ink-200 px-5 py-8 text-center shadow-card">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-400/[0.12] flex items-center justify-center">
              <PackageOpen size={28} className="text-blue-300" aria-hidden="true" />
            </div>
            <p className="mb-1 text-[17px] font-semibold text-fog-100">Your kit is empty</p>
            <p className="mx-auto mb-5 max-w-[260px] text-sm leading-relaxed text-fog-400">
              Add the things you travel with — clothes, grooming, electronics, documents.
              WearWise Go reuses them to build every packing list.
            </p>
            <div className="mx-auto max-w-[220px]">
              <AddTravelItem variant="cta" onAdded={load} />
            </div>
          </div>
        ) : (
          normalCategories.map((cat) => {
            const catItems = byCategory[cat];
            if (catItems.length === 0) return null;
            const Icon = CATEGORY_ICONS[cat];

            return (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <h2
                  id={`cat-${cat}`}
                  className="mb-2.5 flex items-center gap-1.5 px-1 text-[12px] font-semibold uppercase tracking-widest text-blue-300"
                >
                  <Icon size={14} aria-hidden="true" />
                  {CATEGORY_LABELS[cat]}
                  <span className="font-normal normal-case tabular-nums text-fog-500">({catItems.length})</span>
                </h2>

                <ul className="space-y-2" role="list">
                  {catItems.map((item) => (
                    <ItemRow key={item.id} item={item} />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}

function ItemsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1].map((s) => (
        <section key={s}>
          <div className="mb-2.5 h-3 w-24 rounded-full bg-ink-300" />
          <ul className="space-y-2">
            {[0, 1, 2].map((i) => (
              <li key={i} className="skeleton h-[72px] rounded-[1.35rem]" />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ItemRow({ item }: { item: TravelItem }) {
  const display = getItemDisplay(item);
  const tags = item.tags.slice(0, 3);
  const showTags = !display.detail && tags.length > 0;
  const FallbackIcon = CATEGORY_ICONS[item.category as NormalCategory] ?? PackageOpen;

  return (
    <li className="rounded-[1.35rem] border border-white/[0.055] bg-ink-200 px-3.5 py-2.5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-ink-300">
          {display.image ? (
            <Image
              src={display.image}
              alt={item.name}
              width={104}
              height={104}
              className="h-full w-full object-cover"
            />
          ) : (
            <FallbackIcon size={23} className="text-blue-300" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-5 text-fog-100">
                {display.title}
              </p>
              {display.brand && (
                <p className="mt-0.5 truncate text-[12px] font-semibold leading-4 text-blue-300/85">
                  {display.brand}
                </p>
              )}
            </div>
            {item.warmth && (
              <div className="mt-1 flex shrink-0 gap-0.5" aria-label={`Warmth ${item.warmth} of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full ${i < item.warmth! ? 'bg-blue-400' : 'bg-ink-400'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {display.line && (
            <p className="mt-1 line-clamp-1 text-xs leading-4 text-fog-500">
              {display.line}
            </p>
          )}
          {display.detail && (
            <p className="mt-0.5 line-clamp-1 text-[11px] leading-4 text-fog-500">
              {display.detail}
            </p>
          )}
          {showTags && (
            <div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden">
              {tags.map((tag) => (
                <span key={tag} className="max-w-[7rem] truncate rounded-full bg-ink-300 px-2 py-1 text-[11px] font-medium leading-none text-fog-500">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
