'use client';

import { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import { OneUISheet } from '@/components/oneui';
import type { Destination } from '@/types';

const VIBE_GROUPS = [
  {
    label:   'Terrain',
    options: ['mountain', 'snow', 'cold', 'valley', 'desert', 'beach', 'island', 'backwater', 'forest', 'wildlife', 'hillstation', 'river', 'waterfall', 'lake', 'coastal', 'tropical', 'monsoon', 'border'],
  },
  {
    label:   'Place',
    options: ['royal', 'heritage', 'fort', 'city', 'spiritual', 'pilgrimage', 'temple', 'culture', 'village', 'tea', 'coffee', 'food', 'shopping'],
  },
  {
    label:   'Stay',
    options: ['resort', 'luxury', 'farmstay', 'wellness', 'ayurveda', 'camping', 'cruise', 'luxury train'],
  },
  {
    label:   'Trip',
    options: ['business', 'workation', 'romantic', 'family', 'honeymoon', 'weekend', 'adventure', 'trekking', 'roadtrip', 'party', 'peaceful', 'offbeat'],
  },
] as const;

const COMMON_VIBES = ['city', 'beach', 'mountain', 'resort', 'business', 'family'] as const;

function labelFor(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface DestinationInputProps {
  destinations: Destination[];
  onChange:     (destinations: Destination[]) => void;
}

/**
 * Stops on the trip: a city, how many nights, and one word for what kind of
 * place it is. The word is what adds swimwear for a beach or thermals for snow.
 */
export function DestinationInput({ destinations, onChange }: DestinationInputProps) {
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);

  const update = (index: number, patch: Partial<Destination>) =>
    onChange(destinations.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const selectVibe = (index: number, situation?: string) => {
    update(index, { situation });
    setSheetIndex(null);
  };

  const sheetDestination = sheetIndex === null ? undefined : destinations[sheetIndex];
  const multi = destinations.length > 1;

  return (
    <>
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="sr-only">Destinations</legend>

        {destinations.map((dest, i) => (
          <div key={i} className="go-card min-w-0 space-y-4 p-4">
            <div className="flex items-center gap-2">
              {multi && (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[13px] font-semibold tabular-nums text-fog-300">
                  {i + 1}
                </span>
              )}
              <input
                type="text"
                value={dest.city}
                onChange={(e) => update(i, { city: e.target.value })}
                placeholder={i === 0 ? 'Goa, Manali, Jaipur' : 'Next stop'}
                aria-label={`Stop ${i + 1} city`}
                autoComplete="off"
                className="field h-12 min-w-0 flex-1 text-[16px] font-semibold"
              />
              {multi && (
                <button
                  type="button"
                  onClick={() => onChange(destinations.filter((_, j) => j !== i))}
                  aria-label={`Remove stop ${i + 1}`}
                  className="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fog-400 transition-colors hover:bg-white/[0.06] hover:text-fog-100"
                >
                  <X size={16} aria-hidden />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-[14px] font-medium text-fog-200">Nights</span>
              <div className="flex items-center gap-1 rounded-full bg-white/[0.05] p-1" role="group" aria-label={`Nights at stop ${i + 1}`}>
                <button
                  type="button"
                  onClick={() => update(i, { nights: Math.max(1, dest.nights - 1) })}
                  disabled={dest.nights <= 1}
                  aria-label="One night fewer"
                  className="press flex h-10 w-10 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.08] disabled:text-fog-600"
                >
                  <Minus size={16} aria-hidden />
                </button>
                <span className="w-8 text-center text-[17px] font-semibold tabular-nums text-fog-100" aria-live="polite">{dest.nights}</span>
                <button
                  type="button"
                  onClick={() => update(i, { nights: Math.min(60, dest.nights + 1) })}
                  aria-label="One night more"
                  className="press flex h-10 w-10 items-center justify-center rounded-full text-fog-200 transition-colors hover:bg-white/[0.08]"
                >
                  <Plus size={16} aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`What kind of place, stop ${i + 1}`}>
              {COMMON_VIBES.map((sit) => (
                <button
                  key={sit}
                  type="button"
                  aria-pressed={dest.situation === sit}
                  onClick={() => selectVibe(i, dest.situation === sit ? undefined : sit)}
                  className="chip"
                >
                  {labelFor(sit)}
                </button>
              ))}
              {dest.situation && !COMMON_VIBES.includes(dest.situation as (typeof COMMON_VIBES)[number]) && (
                <button type="button" aria-pressed="true" onClick={() => setSheetIndex(i)} className="chip">
                  {labelFor(dest.situation)}
                </button>
              )}
              <button type="button" onClick={() => setSheetIndex(i)} className="chip text-blue-200">
                More
              </button>
            </div>
          </div>
        ))}

        {destinations.length < 5 && (
          <button
            type="button"
            onClick={() => onChange([...destinations, { city: '', nights: 2 }])}
            className="press flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[1.35rem] border border-dashed border-white/[0.14] text-[14px] font-semibold text-fog-300 transition-colors hover:border-blue-400/60 hover:text-fog-100"
          >
            <Plus size={15} aria-hidden />
            Add another stop
          </button>
        )}
      </fieldset>

      <OneUISheet open={sheetIndex !== null} onClose={() => setSheetIndex(null)} title="What kind of place?">
        {sheetDestination && (
          <div className="space-y-5">
            {VIBE_GROUPS.map((group) => (
              <section key={group.label} className="space-y-2">
                <h3 className="px-1 text-[13px] font-semibold text-fog-300">{group.label}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map((sit) => (
                    <button
                      key={sit}
                      type="button"
                      aria-pressed={sheetDestination.situation === sit}
                      onClick={() => sheetIndex !== null && selectVibe(sheetIndex, sheetDestination.situation === sit ? undefined : sit)}
                      className="chip"
                    >
                      {labelFor(sit)}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </OneUISheet>
    </>
  );
}
