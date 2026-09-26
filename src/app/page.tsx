'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bus, Car, ChevronRight, Plane, Plus, RotateCcw, Train } from 'lucide-react';
import { useToday } from '@/hooks/useToday';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import { isActive, placeNames, tripLight, tripTiming, weatherIcon, type TripTiming } from '@/lib/trip-time';
import type { Trip } from '@/types';

interface TripWithProgress {
  trip: Trip;
  timing: TripTiming;
  packed: number;
  total: number;
  packLast: number;
}

const TRANSPORT_ICONS = { plane: Plane, car: Car, train: Train, bus: Bus } as const;

/**
 * Trips.
 *
 * It opened on a date eyebrow, "Ready to move." and a slogan, whatever was
 * going on. Most days nothing is booked, so the whole screen was that slogan
 * and one faded card. The headline is now the state of things ("Goa in 4
 * days.", "Day 2 in Goa.", "Nowhere booked.") and the next trip is the hero,
 * lit by its own weather, with the one action that matters.
 */
export default function HomePage() {
  // null = still loading (renders skeletons); [] = loaded, empty.
  const [trips, setTrips] = useState<TripWithProgress[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    (async () => {
      const [{ data: tripRows, error }, { data: lists }] = await Promise.all([
        supabase.from('trips').select('*').order('departure', { ascending: true }),
        supabase.from('packing_lists').select('trip_id, packed, pack_last, dismissed'),
      ]);
      if (!active) return;

      if (error || !tripRows) {
        setLoadError(true);
        setTrips([]);
        return;
      }
      setLoadError(false);

      const byTrip = new Map<string, { packed: boolean; pack_last: boolean }[]>();
      for (const row of lists ?? []) {
        if (row.dismissed) continue;
        byTrip.set(row.trip_id, [...(byTrip.get(row.trip_id) ?? []), row]);
      }

      const now = new Date();
      setTrips(
        (tripRows as unknown as Trip[]).map((trip) => {
          const rows = byTrip.get(trip.id) ?? [];
          return {
            trip,
            timing: tripTiming(trip, now),
            total: rows.length,
            packed: rows.filter((r) => r.packed).length,
            packLast: rows.filter((r) => r.pack_last && !r.packed).length,
          };
        }),
      );
    })();

    return () => { active = false; };
  }, [reloadKey]);

  const { next, laterTrips, past } = useMemo(() => {
    const list = trips ?? [];
    const activeTrips = list.filter((t) => isActive(t.timing));
    return {
      next: activeTrips[0] ?? null,
      laterTrips: activeTrips.slice(1),
      past: list.filter((t) => !isActive(t.timing)).reverse(),
    };
  }, [trips]);

  const loading = trips === null;
  const today = useToday();

  const headline = !next
    ? 'Nowhere booked.'
    : next.timing.phase === 'ongoing'
    ? `Day ${next.timing.day} in ${placeNames(next.trip).split(',')[0]}.`
    : `${placeNames(next.trip).split(',')[0]} ${next.timing.label}.`;

  const subline = !next
    ? 'Plan a trip and Go builds the list from the weather, the route and your wardrobe.'
    : next.total === 0
    ? 'No list yet. One tap builds it.'
    : next.packed === next.total
    ? 'Everything is packed.'
    : `${next.total - next.packed} of ${next.total} still to pack.`;

  return (
    <main className="min-h-dvh">
      <header className="px-5 pb-5 pt-12">
        <p className="mb-1.5 text-[13px] font-medium text-fog-400">{today || ' '}</p>
        {loading ? (
          <div className="h-9 w-56 animate-pulse rounded-full bg-white/[0.06]" />
        ) : (
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-tight text-fog-100 text-balance">
            {headline}
          </h1>
        )}
        {!loading && !loadError && (
          <p className="mt-1.5 max-w-[34ch] text-[15px] leading-[1.45] text-fog-300 text-pretty">{subline}</p>
        )}
      </header>

      <div className="flex flex-col gap-6 px-4">
        {loading ? (
          <div className="skeleton h-[248px] rounded-[1.75rem]" aria-hidden="true" />
        ) : loadError ? (
          <LoadErrorState onRetry={() => { setTrips(null); setReloadKey((k) => k + 1); }} />
        ) : (
          <>
            {next ? (
              <NextTrip entry={next} />
            ) : (
              <Link
                href="/trips/new"
                className="press flex h-14 items-center justify-center gap-2 rounded-full bg-blue-400 text-[16px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0"
              >
                <Plus size={19} strokeWidth={2.4} aria-hidden />
                Plan a trip
              </Link>
            )}

            {laterTrips.length > 0 && (
              <TripList title="Coming up" trips={laterTrips} />
            )}

            {past.length > 0 && (
              <TripList title="Past trips" trips={past} past />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function NextTrip({ entry }: { entry: TripWithProgress }) {
  const { trip, timing, packed, total, packLast } = entry;
  const Transport = TRANSPORT_ICONS[trip.transport];
  const pct = total > 0 ? Math.round((packed / total) * 100) : 0;
  const urgent = timing.phase === 'today' || timing.phase === 'tomorrow';
  const done = total > 0 && packed === total;
  const cta = total === 0 ? 'Build the list' : done ? 'Open the list' : packed === 0 ? 'Start packing' : 'Continue packing';

  return (
    <section
      aria-label={`Next trip: ${trip.name}`}
      className="relative isolate"
      style={{ '--trip-light': tripLight(trip.weather) } as React.CSSProperties}
    >
      {/* The trip's weather, as light around the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-4 -top-10 bottom-0 -z-10"
        style={{ background: 'radial-gradient(70% 60% at 50% 30%, rgb(var(--trip-light) / 0.22), transparent 72%)' }}
      />
      <div className="go-card overflow-hidden p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[20px] font-semibold leading-7 text-fog-100">{trip.name}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-fog-300">
              <Transport size={14} aria-hidden className="shrink-0 text-fog-400" />
              <span className="truncate">
                {placeNames(trip)} · {timing.nights} night{timing.nights !== 1 ? 's' : ''}
              </span>
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold',
              urgent ? 'bg-amber-500/[0.14] text-amber-300' : 'bg-white/[0.07] text-fog-200',
            )}
          >
            {timing.phase === 'ongoing' ? timing.label : timing.phase === 'upcoming' ? timing.label.replace('in ', '') : timing.label[0].toUpperCase() + timing.label.slice(1)}
          </span>
        </div>

        {trip.weather && trip.weather.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {trip.weather.slice(0, 3).map((w) => {
              const Icon = weatherIcon(w.description);
              return (
                <span key={w.city} className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3 py-1.5 text-[13px] text-fog-200">
                  <Icon size={14} aria-hidden className="text-fog-300" />
                  <span className="font-semibold tabular-nums text-fog-100">{w.tempC}°</span>
                  <span className="max-w-[9rem] truncate capitalize text-fog-300">{w.description}</span>
                </span>
              );
            })}
          </div>
        )}

        {total > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-[14px] font-semibold tabular-nums text-fog-100">
                {packed} <span className="font-medium text-fog-400">of {total} packed</span>
              </span>
              {packLast > 0 && !done && (
                <span className="text-[12px] font-medium text-fog-400">{packLast} to pack last</span>
              )}
            </div>
            <div
              className="h-3 overflow-hidden rounded-full bg-ink-400"
              role="progressbar"
              aria-label="Packing progress"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full rounded-full bg-blue-400 transition-[width] duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <Link
          href={`/trips/${trip.id}`}
          className="press mt-5 flex h-14 items-center justify-center gap-2 rounded-full bg-blue-400 text-[16px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-200"
        >
          {cta}
          <ArrowRight size={18} strokeWidth={2.3} aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function TripList({ title, trips, past }: { title: string; trips: TripWithProgress[]; past?: boolean }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="section-title">{title}</h2>
        <span className="section-meta">{trips.length}</span>
      </div>
      <ul className="group-list divide-y divide-white/[0.06]" role="list">
        {trips.map(({ trip, timing, packed, total }) => {
          const Transport = TRANSPORT_ICONS[trip.transport];
          return (
            <li key={trip.id} className="flex items-center">
              <Link
                href={`/trips/${trip.id}`}
                className="press flex min-h-[64px] min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-400"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-fog-300">
                  <Transport size={16} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-fog-100">{trip.name}</span>
                  <span className="block truncate text-[12px] text-fog-400">
                    {new Date(`${trip.departure}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: past ? 'numeric' : undefined })}
                    {' · '}{placeNames(trip)}
                    {total > 0 && !past ? ` · ${packed}/${total} packed` : ''}
                  </span>
                </span>
                {!past && <span className="shrink-0 text-[12px] font-semibold text-fog-300">{timing.label}</span>}
                {!past && <ChevronRight size={16} className="shrink-0 text-fog-500" aria-hidden />}
              </Link>
              {past && (
                <Link
                  href={`/trips/new?from=${trip.id}`}
                  aria-label={`Pack like ${trip.name} again`}
                  className="press mr-2 flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-blue-200 transition-colors hover:bg-blue-400/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <RotateCcw size={14} aria-hidden />
                  Again
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function LoadErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <section role="alert" className="go-card px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-5 text-fog-100">Couldn&apos;t load trips</h2>
          <p className="mt-1 text-[13px] leading-5 text-fog-400">Check your connection and try again.</p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="press min-h-[44px] shrink-0 rounded-full bg-blue-400/[0.14] px-5 text-[13px] font-semibold text-blue-200 transition-colors hover:bg-blue-400/[0.22]"
        >
          Retry
        </button>
      </div>
    </section>
  );
}
