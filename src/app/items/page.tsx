import { createClient } from '@/lib/supabase/server';
import { OneUIHeader } from '@/components/oneui';
import { CATEGORY_ICONS, CATEGORY_ORDER } from '@/lib/constants';
import type { TravelItem, PackingCategory } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('travel_items')
    .select('*')
    .order('name');

  const items = (error ? [] : (data ?? [])) as TravelItem[];

  const byCategory = CATEGORY_ORDER.reduce<Record<PackingCategory, TravelItem[]>>(
    (acc, cat) => {
      acc[cat] = items.filter(i => i.category === cat);
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
          <div className="flex flex-col items-center justify-center min-h-[50dvh] gap-3 text-center">
            <span className="text-5xl" aria-hidden="true">🎒</span>
            <p className="text-sm text-fog-600 max-w-[220px] leading-relaxed">
              Run the seed SQL in Supabase to populate your default travel kit.
            </p>
          </div>
        ) : (
          CATEGORY_ORDER.map(cat => {
            const catItems = byCategory[cat];
            if (catItems.length === 0) return null;

            return (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <h2
                  id={`cat-${cat}`}
                  className="text-xs font-semibold text-fog-600 uppercase tracking-wider mb-3 flex items-center gap-1.5"
                >
                  <span aria-hidden="true">{CATEGORY_ICONS[cat]}</span>
                  {cat}
                  <span className="text-fog-700 font-normal normal-case">({catItems.length})</span>
                </h2>

                <ul className="bg-ink-100 rounded-oneui-lg divide-y divide-ink-200" role="list">
                  {catItems.map(item => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-fog-100 font-medium truncate">{item.name}</p>
                        {item.tags.length > 0 && (
                          <p className="text-xs text-fog-700 mt-0.5 truncate">
                            {item.tags.join(', ')}
                          </p>
                        )}
                      </div>
                      {item.warmth && (
                        <div className="shrink-0 flex gap-0.5" aria-label={`Warmth ${item.warmth} of 5`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${i < item.warmth! ? 'bg-teal-400' : 'bg-ink-400'}`}
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
