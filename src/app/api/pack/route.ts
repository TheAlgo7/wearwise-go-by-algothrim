import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildPackingList } from '@/lib/packing-engine';
import { fetchAllWeather } from '@/lib/weather';
import type { Json } from '@/lib/supabase/types';
import type { Trip, TravelItem, PackingRule, DestinationWeather, PackingItem, WardrobeItem } from '@/types';

export const maxDuration = 30;

/**
 * Build or rebuild a trip's packing list, on the server, from one call.
 *
 * The client used to fetch weather, then DELETE every row for the trip, then
 * ask this route to insert a fresh list. A failure in between left the trip
 * with no list at all, and a successful "Refresh" silently threw away every
 * tick and every hand-written note. The Ahmedabad list (72 items, 59 ticked,
 * notes like "PACKED in laptop bag") was one tap away from being wiped.
 *
 * Now a rebuild is a merge:
 * - rows already on the list stay exactly as they are (ticks, edits, notes);
 * - rows he added by hand (`source = 'user'`) are never touched;
 * - engine rows that no longer apply go, but only if they are not packed;
 * - anything new is added.
 */
export async function POST(req: NextRequest) {
  let body: { tripId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

  const supabase = await createClient();

  const { data: tripRow, error: tripError } = await supabase.from('trips').select('*').eq('id', body.tripId).single();
  if (tripError || !tripRow) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  const trip = tripRow as unknown as Trip;

  // Weather first; a city it cannot resolve is named rather than fatal, and the
  // last good snapshot stands in when nothing resolves at all.
  const { weather: fresh, missed } = await fetchAllWeather(trip.destinations.map(d => d.city));
  const weather: DestinationWeather[] = fresh.length > 0 ? fresh : (trip.weather ?? []);

  const [itemsRes, rulesRes, wardrobeRes, existingRes] = await Promise.all([
    supabase.from('travel_items').select('*'),
    supabase.from('packing_rules').select('*'),
    // His Wardrobe. Read-only, and optional: if it fails the engine falls back
    // to generic clothing lines rather than refusing to pack.
    supabase
      .from('items')
      .select('id, name, image_url, primary_color, sleeve_length, formality, min_temp_c, max_temp_c, vibe, occasions, category:categories(name, layer_type)')
      .eq('archived', false),
    supabase.from('packing_lists').select('*').eq('trip_id', trip.id),
  ]);

  if (itemsRes.error) return NextResponse.json({ error: itemsRes.error.message }, { status: 502 });
  if (existingRes.error) return NextResponse.json({ error: existingRes.error.message }, { status: 502 });

  const list = buildPackingList({
    trip,
    travelItems: (itemsRes.data ?? []) as TravelItem[],
    packingRules: (rulesRes.data ?? []) as PackingRule[],
    weather,
    wardrobe: wardrobeRes.error ? [] : ((wardrobeRes.data ?? []) as unknown as WardrobeItem[]),
  });

  const generated: PackingItem[] = [
    ...list.critical, ...list.clothing, ...list.grooming,
    ...list.electronics, ...list.documents, ...list.misc,
  ];

  // ── Merge ──
  const existing = (existingRes.data ?? []) as PackingItem[];
  const key = (name: string) => name.toLowerCase().trim();
  const existingNames = new Set(existing.map(r => key(r.name)));
  const generatedNames = new Set(generated.map(r => key(r.name)));

  // One insert gives every row the same created_at, and the screen orders by
  // it, so the list order was whatever Postgres felt like (and shifted after a
  // tick rewrote a row). A millisecond apart keeps the engine's order: tops,
  // then bottoms, then shoes.
  const t0 = Date.now();
  const toInsert = generated
    .filter(g => !existingNames.has(key(g.name)))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ id: _id, ...rest }, i) => ({ ...rest, created_at: new Date(t0 + i).toISOString() }));

  const toDelete = existing
    .filter(r => (r.source ?? 'engine') === 'engine' && !r.packed && !generatedNames.has(key(r.name)))
    .map(r => r.id);

  if (toInsert.length > 0) {
    const { error } = await supabase.from('packing_lists').insert(toInsert as never);
    if (error) return NextResponse.json({ error: `Could not save the list: ${error.message}` }, { status: 502 });
  }
  if (toDelete.length > 0) {
    const { error } = await supabase.from('packing_lists').delete().in('id', toDelete);
    if (error) return NextResponse.json({ error: `Could not tidy the list: ${error.message}` }, { status: 502 });
  }

  if (fresh.length > 0) {
    await supabase.from('trips').update({ weather: fresh as unknown as Json }).eq('id', trip.id);
  }

  return NextResponse.json({
    added: toInsert.length,
    removed: toDelete.length,
    kept: existing.length - toDelete.length,
    weather,
    missed,
  });
}
