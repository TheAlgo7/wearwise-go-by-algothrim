'use client';

import { Plus, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Destination } from '@/types';

const SITUATIONS = ['beach', 'mountain', 'business', 'resort', 'cold', 'city'] as const;

interface DestinationInputProps {
  destinations: Destination[];
  onChange:     (destinations: Destination[]) => void;
}

export function DestinationInput({ destinations, onChange }: DestinationInputProps) {
  const add = () => {
    onChange([...destinations, { city: '', nights: 3 }]);
  };

  const remove = (index: number) => {
    onChange(destinations.filter((_, i) => i !== index));
  };

  const update = (index: number, patch: Partial<Destination>) => {
    onChange(destinations.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-fog-300 mb-2 flex items-center gap-1.5">
        <MapPin size={14} aria-hidden="true" />
        Destinations
      </legend>

      {destinations.map((dest, i) => (
        <div key={i} className="bg-ink-200 rounded-oneui p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-fog-600 font-medium w-5 shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={dest.city}
              onChange={e => update(i, { city: e.target.value })}
              placeholder="City, Country (e.g. Goa,IN)"
              aria-label={`Destination ${i + 1} city`}
              className={cn(
                'flex-1 bg-ink-300 text-fog-100 rounded-oneui-sm px-3 py-2 text-sm',
                'placeholder:text-fog-700 outline-none',
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

          <div className="flex items-center gap-2 pl-7">
            <label
              htmlFor={`nights-${i}`}
              className="text-xs text-fog-600 shrink-0"
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
              className="w-16 bg-ink-300 text-fog-100 rounded-oneui-sm px-2 py-1.5 text-sm text-center outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="pl-7">
            <p className="text-xs text-fog-600 mb-1.5">Vibe (optional)</p>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Situation for destination ${i + 1}`}>
              {SITUATIONS.map(sit => (
                <button
                  key={sit}
                  type="button"
                  aria-pressed={dest.situation === sit}
                  onClick={() => update(i, { situation: dest.situation === sit ? undefined : sit })}
                  className={cn(
                    'px-2.5 py-2 rounded-full text-xs font-medium transition-colors capitalize',
                    dest.situation === sit
                      ? 'bg-blue-400 text-white'
                      : 'bg-ink-300 text-fog-500 hover:bg-ink-400 hover:text-fog-200',
                  )}
                >
                  {sit}
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      {destinations.length < 5 && (
        <button
          type="button"
          onClick={add}
          className="w-full py-2.5 rounded-oneui border border-dashed border-ink-400 text-sm text-fog-600 hover:border-blue-400 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={14} aria-hidden="true" />
          Add destination
        </button>
      )}
    </fieldset>
  );
}
