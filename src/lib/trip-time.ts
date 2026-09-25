import type { Trip, DestinationWeather } from '@/types';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, type LucideIcon } from 'lucide-react';

export type TripPhase = 'upcoming' | 'tomorrow' | 'today' | 'ongoing' | 'past';

export interface TripTiming {
  phase: TripPhase;
  /** Whole days until departure; negative once it has started. */
  daysUntil: number;
  nights: number;
  /** 1-based day of the trip while it is on. */
  day: number | null;
  /** "in 4 days", "tomorrow", "today", "Day 2 of 4", "Back 3 Oct" */
  label: string;
  returnDate: Date;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Where a trip is in time.
 *
 * The old screens split trips on departure alone, so a trip he was on (day 2
 * of 5) was already "Past trips" at 60% opacity with "Departed" beside it.
 * A trip is on until the day he gets back.
 */
export function tripTiming(trip: Trip, now: Date = new Date()): TripTiming {
  const nights = trip.destinations.reduce((s, d) => s + d.nights, 0);
  const dep = startOfDay(new Date(`${trip.departure}T00:00:00`));
  const today = startOfDay(now);
  const daysUntil = Math.round((dep.getTime() - today.getTime()) / 86_400_000);
  const returnDate = new Date(dep);
  returnDate.setDate(returnDate.getDate() + nights);

  const back = returnDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  if (daysUntil > 1) return { phase: 'upcoming', daysUntil, nights, day: null, label: `in ${daysUntil} days`, returnDate };
  if (daysUntil === 1) return { phase: 'tomorrow', daysUntil, nights, day: null, label: 'tomorrow', returnDate };
  if (daysUntil === 0) return { phase: 'today', daysUntil, nights, day: 1, label: 'today', returnDate };
  if (-daysUntil <= nights) {
    const day = -daysUntil + 1;
    return { phase: 'ongoing', daysUntil, nights, day, label: `Day ${day} of ${nights + 1}`, returnDate };
  }
  return { phase: 'past', daysUntil, nights, day: null, label: `Back ${back}`, returnDate };
}

export function isActive(t: TripTiming) {
  return t.phase !== 'past';
}

/** "Goa", or "Goa, Udaipur" for a multi-stop trip. */
export function placeNames(trip: Trip): string {
  return trip.destinations.map(d => d.city.split(',')[0].trim()).filter(Boolean).join(', ');
}

export function weatherIcon(description: string | undefined): LucideIcon {
  const d = (description ?? '').toLowerCase();
  if (/thunder/.test(d)) return CloudLightning;
  if (/drizzle/.test(d)) return CloudDrizzle;
  if (/rain|shower/.test(d)) return CloudRain;
  if (/snow|sleet/.test(d)) return Snowflake;
  if (/mist|fog|haze|smoke|dust/.test(d)) return CloudFog;
  if (/few clouds|scattered/.test(d)) return CloudSun;
  if (/cloud|overcast/.test(d)) return Cloud;
  return Sun;
}

/**
 * The light a trip's hero card is lit by: its weather, not decoration.
 * Cold stops glow ice-blue, mild ones in the accent, hot ones in sun.
 */
export function tripLight(weather: DestinationWeather[] | null | undefined): string {
  if (!weather || weather.length === 0) return '107 159 237';
  const avg = weather.reduce((s, w) => s + w.tempC, 0) / weather.length;
  if (avg < 12) return '156 196 255';
  if (avg >= 28) return '242 190 120';
  return '107 159 237';
}
