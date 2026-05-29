'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BriefcaseBusiness, Bus, CalendarDays, Car, Luggage, Plane, Train } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUIHeader, OneUIButton, OneUIToggle } from '@/components/oneui';
import { DestinationInput } from '@/components/DestinationInput';
import { cn } from '@/lib/cn';
import { DEFAULT_VEHICLE_PROFILE, VEHICLE_PROFILES } from '@/lib/vehicles';
import type { TransportMode, Destination, VehicleProfile } from '@/types';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; hint: string; Icon: React.ElementType }[] = [
  { mode: 'car',   label: 'Road trip',  hint: 'Your car or friends', Icon: Car   },
  { mode: 'plane', label: 'Flight',     hint: 'Liquids, cabin bag', Icon: Plane },
  { mode: 'train', label: 'Train',      hint: 'Rare, comfort kit',  Icon: Train },
  { mode: 'bus',   label: 'Bus',        hint: 'Rare, pack light',   Icon: Bus   },
];

export default function NewTripPage() {
  const router = useRouter();
  const [name,         setName]         = useState('');
  const [departure,    setDeparture]    = useState('');
  const [transport,    setTransport]    = useState<TransportMode>('car');
  const [vehicleProfile, setVehicleProfile] = useState<VehicleProfile>(DEFAULT_VEHICLE_PROFILE);
  const [destinations, setDestinations] = useState<Destination[]>([{ city: '', nights: 3 }]);
  const [carryOnOnly,  setCarryOnOnly]  = useState(false);
  const [isWork,       setIsWork]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    const t = setTimeout(() => { document.title = 'New trip · WearWise Go'; }, 0);
    return () => clearTimeout(t);
  }, []);

  const valid =
    name.trim() &&
    departure &&
    destinations.every(d => d.city.trim() && d.nights >= 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const tripInsert = {
        name:          name.trim(),
        departure,
        transport,
        vehicle_profile: transport === 'car' ? vehicleProfile : null,
        destinations:  destinations as unknown as import('@/lib/supabase/types').Json,
        carry_on_only: carryOnOnly,
        is_work:       isWork,
      };
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert(tripInsert)
        .select('id')
        .single();

      let createdTrip = data;

      if (insertError?.message.toLowerCase().includes('vehicle_profile')) {
        const fallback = await supabase
          .from('trips')
          .insert({
            name:          tripInsert.name,
            departure:     tripInsert.departure,
            transport:     tripInsert.transport,
            destinations:  tripInsert.destinations,
            carry_on_only: tripInsert.carry_on_only,
            is_work:       tripInsert.is_work,
          })
          .select('id')
          .single();

        if (fallback.error) throw new Error(fallback.error.message);
        createdTrip = fallback.data;
      } else if (insertError) {
        throw new Error(insertError.message);
      }

      if (!createdTrip) throw new Error('No trip returned');

      router.push(`/trips/${createdTrip.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <>
      <OneUIHeader
        title="New trip"
        subtitle="Set the route, then let Go build the kit."
        left={
          <Link
            href="/"
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full text-fog-300 transition-colors hover:bg-ink-200"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="px-4 pb-8 pt-2 space-y-4">
        <section className="space-y-3 rounded-[1.65rem] bg-ink-100 p-4">
          <div className="flex items-center gap-2 text-blue-300">
            <CalendarDays size={16} aria-hidden="true" />
            <h2 className="text-[12px] font-semibold uppercase tracking-widest">Trip details</h2>
          </div>

          <label className="block space-y-1.5" htmlFor="trip-name">
            <span className="text-xs font-medium text-fog-500">Trip name</span>
            <input
              id="trip-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Goa escape, Kashmir cold run"
              required
              className={cn(
                'h-12 w-full rounded-oneui bg-ink-300 px-4 text-[15px] text-fog-100',
                'placeholder:text-fog-700 outline-none focus:ring-2 focus:ring-blue-400',
              )}
            />
          </label>

          <label className="block space-y-1.5" htmlFor="departure">
            <span className="text-xs font-medium text-fog-500">Departure date</span>
            <input
              id="departure"
              type="date"
              value={departure}
              onChange={e => setDeparture(e.target.value)}
              required
              className={cn(
                'h-12 w-full rounded-oneui bg-ink-300 px-4 text-[15px] text-fog-100',
                'appearance-none outline-none [color-scheme:dark] focus:ring-2 focus:ring-blue-400',
              )}
            />
          </label>
        </section>

        <section className="space-y-3">
          <div className="px-1">
            <h2 className="text-[12px] font-semibold uppercase tracking-widest text-blue-300">Travel mode</h2>
          </div>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Transport mode">
            {TRANSPORT_OPTIONS.map(({ mode, label, hint, Icon }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={transport === mode}
                onClick={() => setTransport(mode)}
                className={cn(
                  'min-h-[74px] rounded-[1.35rem] px-3 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                  transport === mode
                    ? 'bg-blue-400/20 text-blue-50 ring-1 ring-blue-300/45 shadow-card'
                    : 'bg-ink-100 text-fog-300 hover:bg-ink-200',
                )}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="mt-2 block text-sm font-semibold leading-5">{label}</span>
                <span className={cn('block text-[11px] font-medium leading-4', transport === mode ? 'text-blue-100/65' : 'text-fog-600')}>
                  {hint}
                </span>
              </button>
            ))}
          </div>
        </section>

        {transport === 'car' && (
          <section className="space-y-3">
            <div className="px-1">
              <h2 className="text-[12px] font-semibold uppercase tracking-widest text-blue-300">Road setup</h2>
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [mask-image:linear-gradient(to_right,black_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Vehicle profile">
              {VEHICLE_PROFILES.map(vehicle => (
                <button
                  key={vehicle.id}
                  type="button"
                  aria-pressed={vehicleProfile === vehicle.id}
                  onClick={() => setVehicleProfile(vehicle.id)}
                  className={cn(
                    'min-h-[76px] w-[150px] shrink-0 rounded-[1.35rem] px-3 py-3 text-left transition-all duration-200 active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
                    vehicleProfile === vehicle.id
                      ? 'bg-blue-400/20 text-blue-50 ring-1 ring-blue-300/45 shadow-card'
                      : 'bg-ink-100 text-fog-300 hover:bg-ink-200',
                  )}
                >
                  <span className="block text-sm font-semibold leading-5">{vehicle.label}</span>
                  <span className={cn('mt-1 block text-[11px] font-medium leading-4', vehicleProfile === vehicle.id ? 'text-blue-100/65' : 'text-fog-600')}>
                    {vehicle.hint}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[1.65rem] bg-ink-100 px-4">
          {transport === 'plane' && (
            <ToggleRow
              title="Carry-on only"
              subtitle="Keep liquids under 100ml and pack compact."
              icon={<Luggage size={17} aria-hidden="true" />}
              checked={carryOnOnly}
              onChange={setCarryOnOnly}
            />
          )}
          <ToggleRow
            title="Work trip"
            subtitle="Adds laptop, chargers, and business documents."
            icon={<BriefcaseBusiness size={17} aria-hidden="true" />}
            checked={isWork}
            onChange={setIsWork}
            separated={transport === 'plane'}
          />
        </section>

        <DestinationInput destinations={destinations} onChange={setDestinations} />

        {error && (
          <p role="alert" className="rounded-oneui-sm bg-red-400/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <OneUIButton
          type="submit"
          size="lg"
          loading={loading}
          disabled={!valid}
          className="w-full disabled:bg-ink-200/80 disabled:text-fog-500"
        >
          {loading ? 'Creating trip...' : 'Create trip'}
        </OneUIButton>
      </form>
    </>
  );
}

function ToggleRow({
  title,
  subtitle,
  icon,
  checked,
  onChange,
  separated,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  separated?: boolean;
}) {
  return (
    <div className={cn('flex min-h-[70px] items-center justify-between gap-4 py-3', separated && 'border-t border-white/[0.06]')}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-400/[0.12] text-blue-300">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fog-100">{title}</p>
          <p className="mt-0.5 text-xs leading-4 text-fog-600">{subtitle}</p>
        </div>
      </div>
      <OneUIToggle checked={checked} onChange={onChange} aria-label={title} />
    </div>
  );
}
