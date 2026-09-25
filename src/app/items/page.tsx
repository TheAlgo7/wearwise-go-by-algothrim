'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, ChevronRight, FileText, Luggage, PackageOpen, Plug, Shirt, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AddTravelItem } from '@/components/AddTravelItem';
import { TravelItemSheet } from '@/components/TravelItemSheet';
import { CATEGORY_LABELS } from '@/lib/constants';
import { getItemDisplay } from '@/lib/item-display';
import type { TravelItem, PackingCategory } from '@/types';

type GearCategory = Exclude<PackingCategory, 'clothing'>;
type Filter = GearCategory | 'all';

const GEAR_CATEGORIES: GearCategory[] = ['grooming', 'electronics', 'documents', 'misc'];

const CATEGORY_ICONS: Record<GearCategory, ElementType> = {
  grooming: Sparkles,
  electronics: Plug,
  documents: FileText,
  misc: Luggage,
};

const WARDROBE_URL = 'https://wearwise-by-algothrim.vercel.app/wardrobe';

/**
 * Gear: what he travels with, apart from clothes.
 *
 * It was "Travel items", a stack of 37 full cards, and nothing on it said
 * where clothes came from (nowhere, until now). Clothes are the Wardrobe's
 * job, and Go reads them straight from it, so this page says so in one line
 * and keeps to the gear: grouped lists, the way a phone's own settings lists
 * work, with a filter when he wants one shelf.
 */
export default function ItemsPage() {
  // null = loading (renders skeletons); [] = loaded, empty.
  const [items, setItems] = useState<TravelItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selected, setSelected] = useState<TravelItem | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [wardrobeCount, setWardrobeCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data, error }, { count }] = await Promise.all([
      supabase.from('travel_items').select('*').order('name'),
      supabase.from('items').select('id', { count: 'exact', head: true }).eq('archived', false),
    ]);
    setLoadError(Boolean(error));
    setItems(error ? [] : ((data ?? []) as TravelItem[]).filter((i) => i.category !== 'clothing'));
    setWardrobeCount(count ?? null);
  }, []);

  // load() sets state only after an awaited fetch (not synchronous).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const loading = items === null;
  const list = useMemo(() => items ?? [], [items]);
  const counts = useMemo(
    () => Object.fromEntries(GEAR_CATEGORIES.map((c) => [c, list.filter((i) => i.category === c).length])) as Record<GearCategory, number>,
    [list],
  );
  const shownCategories = GEAR_CATEGORIES.filter((c) => (filter === 'all' || filter === c) && counts[c] > 0);

  return (
    <>
      <header className="flex items-end justify-between gap-4 px-5 pb-4 pt-12">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-tight text-fog-100">Gear</h1>
          <p className="mt-1.5 text-[15px] text-fog-300">
            {loading ? 'What you travel with.' : `${list.length} things Go can pack for you.`}
          </p>
        </div>
        <AddTravelItem onAdded={load} />
      </header>

      <div className="flex flex-col gap-6 px-4 pb-8">
        <a
          href={WARDROBE_URL}
          className="press go-card flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-300"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-fog-200">
            <Shirt size={17} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-fog-100">Clothes come from your Wardrobe</span>
            <span className="block text-[12px] text-fog-400">
              {wardrobeCount !== null ? `${wardrobeCount} pieces, picked by weather and occasion` : 'Picked by weather and occasion'}
            </span>
          </span>
          <ArrowUpRight size={17} className="shrink-0 text-fog-400" aria-hidden />
        </a>

        {loading ? (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-11 animate-pulse rounded-full bg-white/[0.05]" />
            <div className="skeleton h-[280px] rounded-[1.5rem]" />
          </div>
        ) : loadError ? (
          <div role="alert" className="go-card px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-semibold leading-5 text-fog-100">Couldn&apos;t load your gear</p>
                <p className="mt-1 text-[13px] leading-5 text-fog-400">Check your connection and try again.</p>
              </div>
              <button
                type="button"
                onClick={() => { setItems(null); void load(); }}
                className="press min-h-[44px] shrink-0 rounded-full bg-blue-400/[0.14] px-5 text-[13px] font-semibold text-blue-200 transition-colors hover:bg-blue-400/[0.22]"
              >
                Retry
              </button>
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="go-card flex flex-col items-center px-5 py-8 text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06]">
              <PackageOpen size={26} className="text-fog-300" aria-hidden />
            </span>
            <p className="mb-1 text-[17px] font-semibold text-fog-100">No gear yet</p>
            <p className="mb-5 max-w-[30ch] text-[14px] leading-relaxed text-fog-400">
              Add what you travel with: grooming, chargers, documents. Every list reuses it.
            </p>
            <AddTravelItem variant="cta" onAdded={load} />
          </div>
        ) : (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar" role="radiogroup" aria-label="Show">
              <button type="button" role="radio" aria-checked={filter === 'all'} onClick={() => setFilter('all')} className="chip shrink-0">
                All <span className="tabular-nums text-fog-400">{list.length}</span>
              </button>
              {GEAR_CATEGORIES.filter((c) => counts[c] > 0).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={filter === c} onClick={() => setFilter(c)} className="chip shrink-0">
                  {c === 'misc' ? 'Other' : CATEGORY_LABELS[c]} <span className="tabular-nums text-fog-400">{counts[c]}</span>
                </button>
              ))}
            </div>

            {shownCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <section key={cat} aria-labelledby={`cat-${cat}`}>
                  <div className="mb-2 flex items-baseline justify-between px-1">
                    <h2 id={`cat-${cat}`} className="section-title flex items-center gap-2">
                      <Icon size={15} className="text-fog-300" aria-hidden />
                      {cat === 'misc' ? 'Other' : CATEGORY_LABELS[cat]}
                    </h2>
                    <span className="section-meta">{counts[cat]}</span>
                  </div>
                  <ul className="group-list divide-y divide-white/[0.06]" role="list">
                    {list.filter((i) => i.category === cat).map((item) => (
                      <GearRow key={item.id} item={item} Icon={Icon} onSelect={() => setSelected(item)} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        )}
      </div>

      <TravelItemSheet item={selected} onClose={() => setSelected(null)} onDeleted={load} />
    </>
  );
}

function GearRow({ item, Icon, onSelect }: { item: TravelItem; Icon: ElementType; onSelect: () => void }) {
  const display = getItemDisplay(item);
  const secondary = [display.brand, display.detail ?? display.line].filter(Boolean).join(' · ');

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${display.title}${display.brand ? `, ${display.brand}` : ''}. Details`}
        className="press flex min-h-[64px] w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
      >
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white/[0.05]">
          {display.image ? (
            <Image src={display.image} alt="" width={96} height={96} className="h-full w-full object-cover" />
          ) : (
            <Icon size={19} className="text-fog-400" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold leading-5 text-fog-100">{display.title}</span>
          {secondary && <span className="mt-0.5 block truncate text-[12px] leading-4 text-fog-400">{secondary}</span>}
        </span>
        <ChevronRight size={16} className="shrink-0 text-fog-500" aria-hidden />
      </button>
    </li>
  );
}
