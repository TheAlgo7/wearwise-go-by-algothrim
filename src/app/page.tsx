import Link from 'next/link';
import { Luggage, Plus, Route } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TripCard } from '@/components/TripCard';
import type { Trip } from '@/types';

export const dynamic = 'force-dynamic';

interface TripWithProgress {
  trip: Trip;
  packedCount: number;
  totalCount: number;
}

async function getTripsWithProgress(): Promise<TripWithProgress[]> {
  const supabase = await createClient();

  const [{ data: trips, error }, { data: lists }] = await Promise.all([
    supabase.from('trips').select('*').order('departure', { ascending: true }),
    supabase.from('packing_lists').select('trip_id, packed'),
  ]);

  if (error || !trips) return [];

  const listsByTrip = (lists ?? []).reduce<Record<string, { packed: boolean }[]>>(
    (acc, item) => {
      if (!acc[item.trip_id]) acc[item.trip_id] = [];
      acc[item.trip_id].push(item);
      return acc;
    },
    {},
  );

  return (trips as Trip[]).map((trip) => {
    const items = listsByTrip[trip.id] ?? [];
    const totalCount = items.length;
    const packedCount = items.filter((i) => i.packed).length;
    return { trip, packedCount, totalCount };
  });
}

export default async function HomePage() {
  const trips = await getTripsWithProgress();

  const upcoming = trips.filter((t) => new Date(t.trip.departure + 'T00:00:00') >= new Date());
  const past = trips.filter((t) => new Date(t.trip.departure + 'T00:00:00') < new Date());
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  return (
    <main className="min-h-dvh">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] leading-[17px] text-blue-300 font-semibold tracking-widest uppercase mb-2 truncate">
              {today} · Travel kit
            </p>
            <h1 className="text-[30px] font-semibold leading-[1.2] text-blue-50">
              Ready to move.
            </h1>
            <p className="mt-1 text-[13px] leading-5 text-fog-400">
              Pack the things future you would forget.
            </p>
          </div>
          <Link
            href="/trips/new"
            aria-label="New trip"
            className="shrink-0 w-12 h-12 rounded-full bg-blue-400 text-ink-0 flex items-center justify-center shadow-card active:scale-[0.97] transition-colors hover:bg-blue-500"
          >
            <Plus size={22} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-2">
        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {upcoming.length > 0 && (
              <section aria-labelledby="upcoming-heading" className="pt-1">
                <div className="mb-2 flex items-center justify-between px-1">
                  <h2 id="upcoming-heading" className="text-[12px] leading-[17px] text-blue-300 font-semibold tracking-widest uppercase">
                    Upcoming
                  </h2>
                  <p className="text-[11px] font-semibold text-blue-100/45">
                    {upcoming.length} trip{upcoming.length !== 1 ? 's' : ''}
                  </p>
                </div>
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
              <section aria-labelledby="past-heading" className="pt-3">
                <h2 id="past-heading" className="text-[12px] leading-[17px] text-fog-500 font-semibold tracking-widest uppercase mb-2 px-1">
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
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[2rem] border border-white/[0.07] bg-ink-200 px-5 py-8 text-center shadow-card">
      <div
        className="mx-auto mb-4 h-20 w-20 rounded-[2rem] bg-blue-400/[0.12] flex items-center justify-center"
        aria-hidden="true"
      >
        <Luggage size={34} className="text-blue-300" strokeWidth={1.7} />
      </div>
      <h2 className="text-[20px] leading-[26px] font-semibold text-fog-100">No trips yet</h2>
      <p className="mt-2 text-[14px] leading-6 text-fog-400 max-w-[280px] mx-auto">
        Create a route, then WearWise Go will build the packing list from your kit.
      </p>
      <Link
        href="/trips/new"
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-blue-400 px-6 text-[14px] font-semibold text-ink-0 transition-colors hover:bg-blue-500 active:bg-blue-600"
      >
        <Route size={17} aria-hidden="true" />
        New trip
      </Link>
    </div>
  );
}
