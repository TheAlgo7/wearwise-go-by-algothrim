import { FileText, Luggage, PackageOpen, Plug, Shirt, Sparkles } from 'lucide-react';
import type { ElementType } from 'react';
import { createClient } from '@/lib/supabase/server';
import { OneUIHeader } from '@/components/oneui';
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/constants';
import type { TravelItem, PackingCategory } from '@/types';

export const dynamic = 'force-dynamic';

type NormalCategory = Exclude<(typeof CATEGORY_ORDER)[number], 'critical'>;

const CATEGORY_ICONS: Record<NormalCategory, ElementType> = {
  clothing: Shirt,
  grooming: Sparkles,
  electronics: Plug,
  documents: FileText,
  misc: Luggage,
};

export default async function ItemsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('travel_items')
    .select('*')
    .order('name');

  const items = (error ? [] : (data ?? [])) as TravelItem[];

  const normalCategories = CATEGORY_ORDER.filter((c): c is NormalCategory => c !== 'critical');

  const byCategory = normalCategories.reduce<Record<PackingCategory, TravelItem[]>>(
    (acc, cat) => {
      acc[cat] = items.filter((i) => i.category === cat);
      return acc;
    },
    { clothing: [], grooming: [], electronics: [], documents: [], misc: [] },
  );

  return (
    <>
      <OneUIHeader
        title="Travel items"
        subtitle={`${items.length} item${items.length !== 1 ? 's' : ''} in your kit`}
      />

      <div className="px-4 pt-4 pb-8 space-y-6">
        {items.length === 0 ? (
          <div className="rounded-[2rem] border border-white/[0.07] bg-ink-200 px-5 py-8 text-center shadow-card">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-400/[0.12] flex items-center justify-center">
              <PackageOpen size={28} className="text-blue-300" aria-hidden="true" />
            </div>
            <p className="text-sm text-fog-400 max-w-[240px] mx-auto leading-relaxed">
              Run the seed SQL in Supabase to populate your default travel kit.
            </p>
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
                  className="text-xs font-semibold text-blue-300 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1"
                >
                  <Icon size={14} aria-hidden="true" />
                  {CATEGORY_LABELS[cat]}
                  <span className="text-fog-700 font-normal normal-case">({catItems.length})</span>
                </h2>

                <ul className="bg-ink-200 border border-white/[0.06] rounded-[1.65rem] divide-y divide-white/[0.06] shadow-card" role="list">
                  {catItems.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-fog-100 font-medium truncate">{item.name}</p>
                        {item.tags.length > 0 && (
                          <p className="text-xs text-fog-600 mt-0.5 truncate">
                            {item.tags.join(', ')}
                          </p>
                        )}
                      </div>
                      {item.warmth && (
                        <div className="shrink-0 flex gap-0.5" aria-label={`Warmth ${item.warmth} of 5`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${i < item.warmth! ? 'bg-blue-400' : 'bg-ink-400'}`}
                            />
                          ))}
                        </div>
                      )}
                    </li>
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
