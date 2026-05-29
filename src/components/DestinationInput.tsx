'use client';

import { useState } from 'react';
import { Plus, X, MapPin } from 'lucide-react';
import { OneUISheet } from '@/components/oneui';
import { cn } from '@/lib/cn';
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

const COMMON_VIBES = ['mountain', 'snow', 'beach', 'resort', 'city', 'pilgrimage', 'roadtrip', 'business'] as const;

function labelFor(value: string) {
  return value
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface DestinationInputProps {
  destinations: Destination[];
  onChange:     (destinations: Destination[]) => void;
}

export function DestinationInput({ destinations, onChange }: DestinationInputProps) {
  const [sheetIndex, setSheetIndex] = useState<number | null>(null);

  const add = () => {
    onChange([...destinations, { city: '', nights: 3 }]);
  };

  const remove = (index: number) => {
    onChange(destinations.filter((_, i) => i !== index));
  };

  const update = (index: number, patch: Partial<Destination>) => {
    onChange(destinations.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const selectVibe = (index: number, situation?: string) => {
    update(index, { situation });
    setSheetIndex(null);
  };

  const sheetDestination = sheetIndex === null ? undefined : destinations[sheetIndex];

  return (
    <>
      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-2 flex items-center gap-1.5 px-1 text-[12px] font-semibold uppercase tracking-widest text-blue-300">
          <MapPin size={14} aria-hidden="true" />
          Destinations
        </legend>

        {destinations.map((dest, i) => (
          <div key={i} className="min-w-0 space-y-3 overflow-hidden rounded-[1.65rem] bg-ink-100 p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-300 text-xs font-semibold text-fog-500">{i + 1}</span>
              <input
                type="text"
                value={dest.city}
                onChange={e => update(i, { city: e.target.value })}
                placeholder="City, Country (e.g. Goa,IN)"
                aria-label={`Destination ${i + 1} city`}
                className={cn(
                  'h-11 min-w-0 flex-1 rounded-oneui bg-ink-300 px-3 text-[15px] text-fog-100',
                  'placeholder:text-fog-500 outline-none',
                  'focus:ring-2 focus:ring-blue-400',
                )}
              />
              {destinations.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove destination ${i + 1}`}
                  className="w-11 h-11 flex items-center justify-center shrink-0 text-fog-600 hover:text-fog-200 transition-colors rounded-full hover:bg-ink-400"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor={`nights-${i}`}
                className="shrink-0 text-xs font-medium text-fog-600"
              >
                Nights
              </label>
              <input
                id={`nights-${i}`}
                type="number"
                value={dest.nights}
                min={1}
                max={90}
                onChange={e => update(i, { nights: Math.max(1, parseInt(e.target.value) || 1) })}
                aria-label={`Nights in destination ${i + 1}`}
                className="h-10 w-16 rounded-oneui-sm bg-ink-300 px-2 text-center text-sm text-fog-100 outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="min-w-0 space-y-2">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-fog-500">Primary vibe</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-fog-500">Shapes what the engine adds to your kit.</p>
                </div>
                {dest.situation && (
                  <button
                    type="button"
                    onClick={() => selectVibe(i)}
                    className="min-h-[34px] shrink-0 rounded-full px-3 text-xs font-medium text-fog-600 transition-colors hover:bg-ink-300 hover:text-fog-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Primary vibe for destination ${i + 1}`}>
                {COMMON_VIBES.map(sit => (
                  <button
                    key={sit}
                    type="button"
                    aria-pressed={dest.situation === sit}
                    onClick={() => selectVibe(i, dest.situation === sit ? undefined : sit)}
                    className={cn(
                      'flex min-h-[44px] items-center rounded-full px-3 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
                      dest.situation === sit
                        ? 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/45'
                        : 'bg-ink-300 text-fog-500 hover:bg-ink-400 hover:text-fog-200',
                    )}
                  >
                    {labelFor(sit)}
                  </button>
                ))}

                {dest.situation && !COMMON_VIBES.includes(dest.situation as typeof COMMON_VIBES[number]) && (
                  <button
                    type="button"
                    aria-pressed="true"
                    onClick={() => setSheetIndex(i)}
                    className="flex min-h-[44px] items-center rounded-full bg-blue-400/20 px-3 text-xs font-medium text-blue-100 ring-1 ring-blue-300/45 transition-all duration-200 active:scale-[0.97]"
                  >
                    {labelFor(dest.situation)}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSheetIndex(i)}
                  className="flex min-h-[44px] items-center rounded-full bg-ink-300 px-3 text-xs font-semibold text-blue-300 transition-all duration-200 hover:bg-ink-400 active:scale-[0.97]"
                >
                  More
                </button>
              </div>
            </div>
          </div>
        ))}

        {destinations.length < 5 && (
          <button
            type="button"
            onClick={add}
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-[1.35rem] border border-dashed border-ink-500 text-sm font-medium text-fog-500 transition-colors hover:border-blue-400 hover:text-blue-300"
          >
            <Plus size={14} aria-hidden="true" />
            Add destination
          </button>
        )}
      </fieldset>

      <OneUISheet
        open={sheetIndex !== null}
        onClose={() => setSheetIndex(null)}
        title="Choose vibe"
        className="rounded-t-[2rem]"
      >
        {sheetDestination && (
          <div className="space-y-5">
            {VIBE_GROUPS.map(group => (
              <section key={group.label} className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-blue-300">{group.label}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map(sit => (
                    <button
                      key={sit}
                      type="button"
                      aria-pressed={sheetDestination.situation === sit}
                      onClick={() => sheetIndex !== null && selectVibe(sheetIndex, sheetDestination.situation === sit ? undefined : sit)}
                      className={cn(
                        'min-h-[44px] rounded-full px-3 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
                        sheetDestination.situation === sit
                          ? 'bg-blue-400/20 text-blue-100 ring-1 ring-blue-300/45'
                          : 'bg-ink-300 text-fog-500 hover:bg-ink-400 hover:text-fog-200',
                      )}
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
