'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plane, Car, Train, Bus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { OneUIHeader, OneUIButton, OneUIToggle } from '@/components/oneui';
import { DestinationInput } from '@/components/DestinationInput';
import { cn } from '@/lib/cn';
import type { TransportMode, Destination } from '@/types';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; Icon: React.ElementType }[] = [
  { mode: 'plane', label: 'Flight',     Icon: Plane },
  { mode: 'car',   label: 'Road trip',  Icon: Car   },
  { mode: 'train', label: 'Train',      Icon: Train  },
  { mode: 'bus',   label: 'Bus',        Icon: Bus   },
];

export default function NewTripPage() {
  const router = useRouter();
  const [name,         setName]         = useState('');
  const [departure,    setDeparture]    = useState('');
  const [transport,    setTransport]    = useState<TransportMode>('plane');
  const [destinations, setDestinations] = useState<Destination[]>([{ city: '', nights: 3 }]);
  const [carryOnOnly,  setCarryOnOnly]  = useState(false);
  const [isWork,       setIsWork]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

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
      const { data, error: insertError } = await supabase
        .from('trips')
        .insert({
          name:          name.trim(),
          departure,
          transport,
          destinations:  destinations as unknown as import('@/lib/supabase/types').Json,
          carry_on_only: carryOnOnly,
          is_work:       isWork,
        })
        .select('id')
        .single();

      if (insertError) throw new Error(insertError.message);
      if (!data) throw new Error('No trip returned');

      router.push(`/trips/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <>
      <OneUIHeader
        title="New trip"
        left={
          <Link
            href="/"
            aria-label="Back"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink-200 transition-colors"
          >
            <ArrowLeft size={20} className="text-fog-300" aria-hidden="true" />
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="px-4 pt-5 pb-8 space-y-6">
        {/* Trip name */}
        <div className="space-y-1.5">
          <label htmlFor="trip-name" className="text-sm font-medium text-fog-300">
            Trip name
          </label>
          <input
            id="trip-name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Goa Escape, Berlin Work Trip"
            required
            className={cn(
              'w-full bg-ink-200 text-fog-100 rounded-oneui px-4 py-3 text-sm',
              'placeholder:text-fog-700 outline-none focus:ring-2 focus:ring-blue-400',
            )}
          />
        </div>

        {/* Departure date */}
        <div className="space-y-1.5">
          <label htmlFor="departure" className="text-sm font-medium text-fog-300">
            Departure date
          </label>
          <input
            id="departure"
            type="date"
            value={departure}
            onChange={e => setDeparture(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
            className={cn(
              'w-full bg-ink-200 text-fog-100 rounded-oneui px-4 py-3 text-sm',
              'outline-none focus:ring-2 focus:ring-blue-400',
              'appearance-none [color-scheme:dark]',
            )}
          />
        </div>

        {/* Transport */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-fog-300">How are you getting there?</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Transport mode">
            {TRANSPORT_OPTIONS.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                aria-pressed={transport === mode}
                onClick={() => setTransport(mode)}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-3 rounded-oneui text-sm font-medium transition-colors',
                  transport === mode
                    ? 'bg-blue-400 text-white'
                    : 'bg-ink-200 text-fog-400 hover:bg-ink-300 hover:text-fog-100',
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Carry-on only (plane only) */}
        {transport === 'plane' && (
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-fog-200">Carry-on only</p>
              <p className="text-xs text-fog-600 mt-0.5">Liquids max 100ml, tight on space</p>
            </div>
            <OneUIToggle
              checked={carryOnOnly}
              onChange={setCarryOnOnly}
              aria-label="Carry-on only"
            />
          </div>
        )}

        {/* Work trip */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-fog-200">Work trip</p>
            <p className="text-xs text-fog-600 mt-0.5">Adds laptop, business documents</p>
          </div>
          <OneUIToggle
            checked={isWork}
            onChange={setIsWork}
            aria-label="Work trip"
          />
        </div>

        {/* Destinations */}
        <DestinationInput destinations={destinations} onChange={setDestinations} />

        {error && (
          <p role="alert" className="text-sm text-red-400 bg-red-400/10 rounded-oneui-sm px-3 py-2">
            {error}
          </p>
        )}

        <OneUIButton
          type="submit"
          size="lg"
          loading={loading}
          disabled={!valid}
          className="w-full"
        >
          {loading ? 'Creating trip…' : 'Create trip'}
        </OneUIButton>
      </form>
    </>
  );
}
