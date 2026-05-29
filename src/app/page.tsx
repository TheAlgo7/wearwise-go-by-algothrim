import { CalendarDays, CheckCircle2, Luggage, Sparkles } from 'lucide-react';
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
      <div className="px-5 pt-12 pb-4">
        <div className="mb-2 min-w-0">
          <p className="truncate text-[12px] font-semibold uppercase leading-[17px] tracking-widest text-blue-300">
            {today} · Travel kit
          </p>
        </div>
        <div className="min-w-0">
          <h1 className="text-[32px] font-semibold leading-[1.15] text-blue-50">
            Ready to move.
          </h1>
          <p className="mt-2 max-w-[320px] text-[14px] leading-5 text-fog-400">
            Pack the things future you would forget.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-2">
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
    <section aria-labelledby="empty-heading" className="rounded-[1.65rem] bg-ink-100 px-4 py-4">
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-blue-400/[0.12]"
          aria-hidden="true"
        >
          <Luggage size={24} className="text-blue-300" strokeWidth={1.7} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="empty-heading" className="text-[17px] font-semibold leading-6 text-fog-100">
            No trips yet
          </h2>
          <p className="mt-1 text-[13px] leading-5 text-fog-500">
            Add a destination when the plan is real. WearWise Go will handle the kit.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 border-t border-white/[0.06] pt-3">
        <div className="px-1">
          <CalendarDays size={16} className="mb-2 text-blue-300" aria-hidden="true" />
          <p className="text-[11px] font-semibold leading-4 text-fog-300">Dates</p>
        </div>
        <div className="border-l border-white/[0.06] px-3">
          <Sparkles size={16} className="mb-2 text-blue-300" aria-hidden="true" />
          <p className="text-[11px] font-semibold leading-4 text-fog-300">Weather</p>
        </div>
        <div className="border-l border-white/[0.06] px-3">
          <CheckCircle2 size={16} className="mb-2 text-blue-300" aria-hidden="true" />
          <p className="text-[11px] font-semibold leading-4 text-fog-300">Essentials</p>
        </div>
      </div>
    </section>
  );
}
