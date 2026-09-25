import type { Trip, DestinationWeather, PackingItem } from '@/types';
import { TRANSPORT_LABELS, URGENCY_DAYS } from './constants';
import { getVehicleProfileInfo } from './vehicles';

/**
 * The model reads the finished list and writes up to three short notes.
 *
 * It used to be asked for "a packing intelligence note" of up to 200 words,
 * which arrived as a paragraph wall above the checklist and pushed the list,
 * the thing he opened the screen for, below the fold. Three lines, plain text,
 * each one a specific call about this trip, or nothing.
 */
export function buildNotesPrompt(
  trip: Trip,
  weather: DestinationWeather[],
  items: PackingItem[],
): { system: string; user: string } {
  const totalNights = trip.destinations.reduce((sum, d) => sum + d.nights, 0);
  const isPlane = trip.transport === 'plane';
  const vehicleInfo = trip.transport === 'car' ? getVehicleProfileInfo(trip.vehicle_profile) : undefined;
  const departure = new Date(trip.departure + 'T00:00:00');
  const daysUntil = Math.ceil((departure.getTime() - Date.now()) / 86_400_000);
  const isUrgent = daysUntil <= URGENCY_DAYS;

  const weatherSummary = weather.length
    ? weather.map(w => `${w.city}: ${w.tempC}°C, ${w.description}, humidity ${w.humidity}%`).join('\n')
    : 'Unknown';

  const destinationSummary = trip.destinations
    .map(d => `${d.city.split(',')[0]} (${d.nights} night${d.nights !== 1 ? 's' : ''}${d.situation ? `, ${d.situation}` : ''})`)
    .join(' then ');

  const line = (i: PackingItem) =>
    `- ${i.quantity > 1 ? `${i.quantity}x ` : ''}${i.name}${i.pack_last ? ' [pack last]' : ''}${i.packed ? ' [packed]' : ''}${i.notes ? ` (${i.notes})` : ''}`;

  const system = `You review a traveller's packing list and write at most three short notes about it.
Rules:
- Plain text only. One note per line. No bullets, numbers, markdown, headings or emoji.
- Each note under 18 words, second person, specific to this trip.
- Only what matters: something missing, something to cut, or a real watch-out (liquids over 100ml on a carry-on, rain, cold, a long drive).
- Never repeat an item that is already on the list as if it were missing.
- If the list is already right, write one short line saying so.
- No em dashes or en dashes. Use commas or full stops.`;

  const user = `Trip: ${trip.name}
Leaving: ${trip.departure}${isUrgent ? ' (very soon)' : ''}
Getting there: ${TRANSPORT_LABELS[trip.transport]}${vehicleInfo ? `, ${vehicleInfo.label}: ${vehicleInfo.packingNote}` : ''}${isPlane && trip.carry_on_only ? ', carry-on only' : ''}
Work trip: ${trip.is_work ? 'yes' : 'no'}
Route: ${destinationSummary}, ${totalNights} night${totalNights !== 1 ? 's' : ''} total

Weather now:
${weatherSummary}

The list:
${items.map(line).join('\n')}`;

  return { system, user };
}

/** Normalise whatever the model returns into at most three clean lines. */
export function parseNotes(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[\s\-*•\d.)]+/, '').replace(/\*\*/g, '').replace(/\s[–—]\s/g, ', ').trim())
    .filter(l => l.length > 3)
    .slice(0, 3);
}
