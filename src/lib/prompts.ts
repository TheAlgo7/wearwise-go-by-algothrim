import type { Trip, DestinationWeather, GeneratedPackingList } from '@/types';
import { TRANSPORT_LABELS } from './constants';

export function buildPackingPrompt(
  trip: Trip,
  weather: DestinationWeather[],
  engineList: Omit<GeneratedPackingList, 'reasoning'>,
): string {
  const totalNights = trip.destinations.reduce((sum, d) => sum + d.nights, 0);
  const isPlane     = trip.transport === 'plane';

  const weatherSummary = weather
    .map(w => `${w.city}: ${w.tempC}°C, ${w.description}, humidity ${w.humidity}%`)
    .join('\n');

  const destinationSummary = trip.destinations
    .map(d => `${d.city} (${d.nights} night${d.nights !== 1 ? 's' : ''}${d.situation ? `, ${d.situation}` : ''})`)
    .join(' → ');

  const formatSection = (items: GeneratedPackingList[keyof Omit<GeneratedPackingList, 'reasoning'>]) =>
    items.map(i => `- ${i.quantity}× ${i.name}${i.notes ? ` [${i.notes}]` : ''}`).join('\n');

  const systemPrompt = `You are a meticulous packing expert who gives concrete, honest, no-fluff advice.
You know that the worst packing mistake is not forgetting something — it is bringing too much and arriving exhausted.
Your job: review the deterministic packing list below and add exactly the observations that matter.
Rules:
- Never suggest more than 3 additions per category
- Flag redundancies if obvious (e.g. 3 similar jackets)
- If travelling by plane with carry-on only, flag any item that's likely over 100ml
- Keep your response under 200 words
- Write in second person ("You'll want...", "Skip the...")
- No em dashes`;

  const userPrompt = `Trip: ${trip.name}
Departure: ${trip.departure}
Transport: ${TRANSPORT_LABELS[trip.transport]}${isPlane && trip.carry_on_only ? ' — carry-on only' : ''}
Itinerary: ${destinationSummary}
Total: ${totalNights} night${totalNights !== 1 ? 's' : ''}

Weather at destinations:
${weatherSummary}

Deterministic packing list generated:

CLOTHING:
${formatSection(engineList.clothing)}

GROOMING:
${formatSection(engineList.grooming)}

ELECTRONICS:
${formatSection(engineList.electronics)}

DOCUMENTS:
${formatSection(engineList.documents)}

MISC:
${formatSection(engineList.misc)}

Review this list and give a concise packing intelligence note: what to add, what to cut, and any situational watch-outs.`;

  return JSON.stringify({ system: systemPrompt, user: userPrompt });
}
