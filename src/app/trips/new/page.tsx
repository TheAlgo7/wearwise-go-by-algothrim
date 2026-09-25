'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Bus, Car, Loader2, Luggage, Plane, Train } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUIToggle } from '@/components/oneui';
import { DestinationInput } from '@/components/DestinationInput';
import { cn } from '@/lib/cn';
import { DEFAULT_VEHICLE_PROFILE, VEHICLE_PROFILES } from '@/lib/vehicles';
import type { TransportMode, Destination, VehicleProfile, Trip, PackingItem } from '@/types';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; hint: string; Icon: React.ElementType }[] = [
  { mode: 'car',   label: 'Road trip', hint: 'Your car or a friend’s', Icon: Car   },
  { mode: 'plane', label: 'Flight',    hint: 'Liquids, cabin bag',     Icon: Plane },
  { mode: 'train', label: 'Train',     hint: 'Comfort kit',            Icon: Train },
  { mode: 'bus',   label: 'Bus',       hint: 'Pack light',             Icon: Bus   },
];

function isoDay(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
}

/** The coming Saturday (today, if today is Saturday). */
function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7));
  return d.toLocaleDateString('en-CA');
}

export default function NewTripPage() {
  // useSearchParams needs a Suspense boundary to prerender.
  return (
    <Suspense fallback={null}>
      <NewTripForm />
    </Suspense>
  );
}

/**
 * A new trip, in the order he thinks about one: where, when, how, then details.
 *
 * The old form opened on "Trip name" (the least important field) under an
 * uppercase eyebrow, ended on a Create button, and landed on an empty trip
 * page with the list still to be built. Now the name writes itself from the
 * destination and month, nights are a stepper instead of a number box, and the
 * button builds the list as part of creating the trip.
 *
 * `?from=<tripId>` (Pack like this again) pre-fills everything from an old trip
 * and copies its list, unticked, instead of building a fresh one.
 */
function NewTripForm() {
  const router = useRouter();
  const fromId = useSearchParams().get('from');

  const [name,           setName]           = useState('');
  const [departure,      setDeparture]      = useState('');
  const [transport,      setTransport]      = useState<TransportMode>('car');
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile>(DEFAULT_VEHICLE_PROFILE);
  const [destinations,   setDestinations]   = useState<Destination[]>([{ city: '', nights: 3 }]);
  const [carryOnOnly,    setCarryOnOnly]    = useState(false);
  const [isWork,         setIsWork]         = useState(false);
  const [source,         setSource]         = useState<Trip | null>(null);
  // Trips added from photos have no list, so there is nothing to copy.
  const [sourceHasList,  setSourceHasList]  = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');

  useEffect(() => {
    document.title = 'New trip · WearWise Go';
  }, []);

  // Pre-fill from the trip being repeated.
  useEffect(() => {
    if (!fromId) return;
    let active = true;
    (async () => {
      const supabase = createClient();
      const [{ data }, { count }] = await Promise.all([
        supabase.from('trips').select('*').eq('id', fromId).single(),
        supabase.from('packing_lists').select('id', { count: 'exact', head: true }).eq('trip_id', fromId).eq('dismissed', false),
      ]);
      if (!active || !data) return;
      const t = data as unknown as Trip;
      setSource(t);
      setSourceHasList((count ?? 0) > 0);
      setTransport(t.transport);
      if (t.vehicle_profile) setVehicleProfile(t.vehicle_profile);
      setDestinations(t.destinations.map((d) => ({ ...d })));
      setCarryOnOnly(t.carry_on_only);
      setIsWork(t.is_work);
    })();
    return () => { active = false; };
  }, [fromId]);

  const autoName = useMemo(() => {
    const first = destinations[0]?.city.split(',')[0].trim();
    if (!first) return '';
    const month = departure
      ? new Date(`${departure}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })
      : null;
    const more = destinations.length > 1 ? ` +${destinations.length - 1}` : '';
    return `${first[0].toUpperCase()}${first.slice(1)}${more}${month ? `, ${month}` : ''}`;
  }, [destinations, departure]);

  const finalName = name.trim() || autoName;
  const valid = Boolean(finalName && departure && destinations.every((d) => d.city.trim() && d.nights >= 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: created, error: insertError } = await supabase
        .from('trips')
        .insert({
          name:            finalName,
          departure,
          transport,
          vehicle_profile: transport === 'car' ? vehicleProfile : null,
          destinations:    destinations.map((d) => ({ ...d, city: d.city.trim() })) as unknown as import('@/lib/supabase/types').Json,
          carry_on_only:   transport === 'plane' && carryOnOnly,
          is_work:         isWork,
        })
        .select('id')
        .single();
      if (insertError || !created) throw new Error(insertError?.message ?? 'No trip returned');

      if (source) {
        // Repeat: copy the old list, unticked. Marked as his own rows, so a
        // later rebuild adds to it rather than tidying away the curated items.
        const { data: rows } = await supabase
          .from('packing_lists')
          .select('*')
          .eq('trip_id', source.id)
          .order('created_at')
          .order('id');
        const t0 = Date.now();
        const copy = ((rows ?? []) as PackingItem[])
          .filter((r) => !r.dismissed)
          .map((r, i) => ({
            // Keep the old list's order (see /api/pack for why each row gets its own time).
            created_at: new Date(t0 + i).toISOString(),
            trip_id: created.id,
            category: r.category,
            name: r.name,
            quantity: r.quantity,
            packed: false,
            is_clothing: r.is_clothing,
            priority: r.priority,
            notes: r.notes ?? null,
            destination_label: null,
            pack_last: r.pack_last ?? false,
            source: 'user',
            image_url: r.image_url ?? null,
            wardrobe_item_id: r.wardrobe_item_id ?? null,
          }));
        if (copy.length > 0) {
          const { error: copyError } = await supabase.from('packing_lists').insert(copy as never);
          if (copyError) throw new Error(copyError.message);
        }
      }

      // The trip page builds a fresh list itself when it opens on an empty one.
      router.push(`/trips/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <>
      <header className="px-4 pb-2 pt-3">
        <Link
          href="/"
          aria-label="Back"
          className="press -ml-1 flex h-11 w-11 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.06]"
        >
          <ArrowLeft size={21} aria-hidden />
        </Link>
        <h1 className="mt-2 px-1 text-[28px] font-semibold leading-[1.15] tracking-tight text-fog-100">
          {source ? `Again: ${source.name}` : 'Where to?'}
        </h1>
        <p className="mt-1 px-1 text-[14px] text-fog-300">
          {source
            ? sourceHasList
              ? 'Same route and list, new dates. Change anything below.'
              : 'Same route, new dates. Go builds the list for them.'
            : 'Go builds the list from here.'}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-7 px-4 pb-10 pt-4">
        <DestinationInput destinations={destinations} onChange={setDestinations} />

        <section className="space-y-2.5" aria-labelledby="when-heading">
          <h2 id="when-heading" className="section-title px-1">When do you leave?</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={departure === isoDay(1)} onClick={() => setDeparture(isoDay(1))} className="chip">
              Tomorrow
            </button>
            <button type="button" aria-pressed={departure === nextSaturday()} onClick={() => setDeparture(nextSaturday())} className="chip">
              This Saturday
            </button>
          </div>
          <label htmlFor="departure" className="sr-only">Departure date</label>
          <input
            id="departure"
            type="date"
            value={departure}
            min={isoDay(0)}
            onChange={(e) => setDeparture(e.target.value)}
            required
            className="field appearance-none [color-scheme:dark]"
          />
        </section>

        <section className="space-y-2.5" aria-labelledby="how-heading">
          <h2 id="how-heading" className="section-title px-1">How are you getting there?</h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Transport">
            {TRANSPORT_OPTIONS.map(({ mode, label, hint, Icon }) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={transport === mode}
                onClick={() => setTransport(mode)}
                className={cn(
                  'press min-h-[76px] rounded-[1.35rem] border px-3.5 py-3 text-left transition-colors duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  // Selected reads as raised, like every other choice in the
                  // app; the blue is only the icon, marking which one.
                  transport === mode
                    ? 'border-white/[0.16] bg-ink-500 text-fog-100 shadow-[0_1px_0_rgb(255_255_255/0.07)_inset]'
                    : 'border-white/[0.06] bg-ink-200 text-fog-300 hover:bg-ink-300',
                )}
              >
                <Icon size={19} aria-hidden className={transport === mode ? 'text-blue-300' : 'text-fog-400'} />
                <span className="mt-2 block text-[15px] font-semibold leading-5">{label}</span>
                <span className="block text-[12px] font-medium leading-4 text-fog-400">{hint}</span>
              </button>
            ))}
          </div>

          {transport === 'car' && (
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-1 no-scrollbar" role="radiogroup" aria-label="Which car">
              {VEHICLE_PROFILES.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  role="radio"
                  aria-checked={vehicleProfile === vehicle.id}
                  onClick={() => setVehicleProfile(vehicle.id)}
                  className="chip shrink-0"
                >
                  {vehicle.shortLabel}
                </button>
              ))}
            </div>
          )}

          {transport === 'plane' && (
            <ToggleRow
              title="Cabin bag only"
              subtitle="Liquids over 100ml get flagged."
              icon={<Luggage size={17} aria-hidden />}
              checked={carryOnOnly}
              onChange={setCarryOnOnly}
            />
          )}
        </section>

        <ToggleRow
          title="Work trip"
          subtitle="Adds the laptop, its charger and smarter clothes."
          icon={<BriefcaseBusiness size={17} aria-hidden />}
          checked={isWork}
          onChange={setIsWork}
        />

        <label className="block space-y-2.5" htmlFor="trip-name">
          <span className="section-title block px-1">Name</span>
          <input
            id="trip-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={autoName || 'Named after where you’re going'}
            className="field"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-[1.25rem] bg-red-400/10 px-4 py-2.5 text-[14px] text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={!valid || loading}
          className="press flex h-14 w-full items-center justify-center gap-2 rounded-full bg-blue-400 text-[16px] font-semibold text-ink-0 transition-colors hover:bg-blue-300 disabled:bg-white/[0.07] disabled:text-fog-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0"
        >
          {loading && <Loader2 size={18} className="animate-spin" aria-hidden />}
          {loading ? 'Creating' : source && sourceHasList ? 'Copy the list' : 'Build my list'}
        </button>
      </form>
    </>
  );
}

function ToggleRow({
  title, subtitle, icon, checked, onChange,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-[68px] items-center justify-between gap-4 rounded-[1.35rem] border border-white/[0.06] bg-ink-200 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-fog-300">{icon}</span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-fog-100">{title}</p>
          <p className="mt-0.5 text-[12px] leading-4 text-fog-400">{subtitle}</p>
        </div>
      </div>
      <OneUIToggle checked={checked} onChange={onChange} aria-label={title} />
    </div>
  );
}
