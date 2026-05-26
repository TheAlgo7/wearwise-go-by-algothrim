import Link from 'next/link';
import { Plane, Car, Train, Bus, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Trip } from '@/types';
import { TRANSPORT_LABELS } from '@/lib/constants';

const TRANSPORT_ICONS = {
  plane: Plane,
  car: Car,
  train: Train,
  bus: Bus,
};

interface TripCardProps {
  trip: Trip;
  packedCount: number;
  totalCount: number;
}

export function TripCard({ trip, packedCount, totalCount }: TripCardProps) {
  const TransportIcon = TRANSPORT_ICONS[trip.transport];
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;
  const allPacked = totalCount > 0 && packedCount === totalCount;

  const departureDate = new Date(trip.departure + 'T00:00:00');
  const daysUntil = Math.ceil(
    (departureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const cityNames = trip.destinations.map((d) => d.city.split(',')[0]).join(' → ');

  return (
    <Link
      href={`/trips/${trip.id}`}
      className={cn(
        'block bg-ink-200 border border-white/[0.06] rounded-[1.65rem] p-4 shadow-card transition-all duration-150',
        'hover:bg-ink-300 active:scale-[0.98]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400',
      )}
      aria-label={`${trip.name}, departing in ${daysUntil} days`}
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-blue-400/[0.12] flex items-center justify-center shrink-0">
          <TransportIcon size={20} className="text-blue-300" aria-hidden="true" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[16px] font-semibold text-fog-100 truncate leading-tight">{trip.name}</h2>
            <ChevronRight size={16} className="text-fog-600 shrink-0" aria-hidden="true" />
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-xs text-fog-500">
            <MapPin size={11} aria-hidden="true" />
            <span className="truncate">{cityNames}</span>
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-fog-500">
              {TRANSPORT_LABELS[trip.transport]}
              {trip.carry_on_only ? ' · carry-on only' : ''}
            </span>
            <span className={cn('text-xs font-medium', daysUntil <= 3 ? 'text-amber-400' : 'text-fog-500')}>
              {daysUntil === 0
                ? 'Today'
                : daysUntil < 0
                  ? 'Departed'
                  : `${daysUntil}d away`}
            </span>
          </div>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-fog-600">
              {packedCount} / {totalCount} packed
            </span>
            {allPacked && (
              <span className="text-[10px] text-blue-300 font-medium">Ready</span>
            )}
          </div>
          <div className="h-1 bg-ink-300 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={cn('h-full rounded-full transition-all duration-500', allPacked ? 'bg-blue-400' : 'bg-blue-600')}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
