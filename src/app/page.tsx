import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { OneUIHeader } from '@/components/oneui';
import { TripCard } from '@/components/TripCard';
import type { Trip } from '@/types';

export const dynamic = 'force-dynamic';

interface TripWithProgress {
  trip:        Trip;
  packedCount: number;
  totalCount:  number;
}

async function getTripsWithProgress(): Promise<TripWithProgress[]> {
  const supabase = await createClient();

  const { data: trips, error } = await supabase
    .from('trips')
    .select('*')
    .order('departure', { ascending: true });

  if (error || !trips) return [];

  const { data: lists } = await supabase
    .from('packing_lists')
    .select('trip_id, packed');

  const listsByTrip = (lists ?? []).reduce<Record<string, { packed: boolean }[]>>(
    (acc, item) => {
      if (!acc[item.trip_id]) acc[item.trip_id] = [];
      acc[item.trip_id].push(item);
      return acc;
    },
    {},
  );

  return (trips as Trip[]).map(trip => {
    const items      = listsByTrip[trip.id] ?? [];
    const totalCount  = items.length;
    const packedCount = items.filter(i => i.packed).length;
    return { trip, packedCount, totalCount };
  });
}

export default async function HomePage() {
  const trips = await getTripsWithProgress();

  const upcoming = trips.filter(t => new Date(t.trip.departure + 'T00:00:00') >= new Date());
  const past     = trips.filter(t => new Date(t.trip.departure + 'T00:00:00') <  new Date());

  return (
    <>
      <OneUIHeader
        title="WearWise Go"
        subtitle="Pack like you already remembered everything."
        right={
          <Link
            href="/trips/new"
            aria-label="New trip"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-teal-400 text-ink-0 hover:bg-teal-500 active:bg-teal-600 transition-colors"
          >
            <Plus size={20} aria-hidden="true" />
          </Link>
        }
      />

      <div className="px-4 pt-4 pb-2 space-y-6">
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-heading">
                <h2 id="upcoming-heading" className="text-xs font-semibold text-fog-600 uppercase tracking-wider mb-3 px-1">
                  Upcoming
                </h2>
                <ul className="space-y-3" role="list">
                  {upcoming.map(({ trip, packedCount, totalCount }) => (
                    <li key={trip.id}>
                      <TripCard trip={trip} packedCount={packedCount} totalCount={totalCount} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <section aria-labelledby="past-heading">
                <h2 id="past-heading" className="text-xs font-semibold text-fog-600 uppercase tracking-wider mb-3 px-1">
                  Past trips
                </h2>
                <ul className="space-y-3 opacity-60" role="list">
                  {past.map(({ trip, packedCount, totalCount }) => (
                    <li key={trip.id}>
                      <TripCard trip={trip} packedCount={packedCount} totalCount={totalCount} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 text-center px-6">
      <div
        className="w-20 h-20 rounded-oneui-xl bg-teal-400/10 flex items-center justify-center text-4xl"
        aria-hidden="true"
      >
        🧳
      </div>
      <div>
        <h2 className="text-lg font-semibold text-fog-100 mb-1">No trips yet</h2>
        <p className="text-sm text-fog-600 max-w-[240px] mx-auto leading-relaxed">
          Create your first trip and WearWise Go will build your packing list from your wardrobe.
        </p>
      </div>
      <Link
        href="/trips/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-teal-400 text-ink-0 rounded-oneui font-medium text-sm hover:bg-teal-500 active:bg-teal-600 transition-colors"
      >
        <Plus size={18} aria-hidden="true" />
        New trip
      </Link>
    </div>
  );
}
