import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chat } from '@/lib/llm';
import { buildNotesPrompt, parseNotes } from '@/lib/prompts';
import type { Trip, PackingItem } from '@/types';

export const maxDuration = 30;

/**
 * Up to three notes about a finished list, written by a model.
 *
 * Separate from /api/pack on purpose: the list appears as soon as the engine
 * has built it, and the notes fill in afterwards. Waiting on a model before
 * showing a checklist the code already had was the slowest part of the old flow.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { tripId?: string };
  if (!body.tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 });

  const supabase = await createClient();
  const [{ data: tripRow }, { data: rows }] = await Promise.all([
    supabase.from('trips').select('*').eq('id', body.tripId).single(),
    supabase.from('packing_lists').select('*').eq('trip_id', body.tripId),
  ]);
  if (!tripRow) return NextResponse.json({ error: 'Trip not found' }, { status: 404 });

  const trip = tripRow as unknown as Trip;
  const items = ((rows ?? []) as PackingItem[]).filter(r => !r.dismissed);
  if (items.length === 0) return NextResponse.json({ notes: [] });

  try {
    const { system, user } = buildNotesPrompt(trip, trip.weather ?? [], items);
    const notes = parseNotes(await chat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ]));
    if (notes.length > 0) {
      await supabase.from('trips').update({ packing_reasoning: notes.join('\n') }).eq('id', trip.id);
    }
    return NextResponse.json({ notes });
  } catch {
    // Notes are a nice-to-have. The list is already there.
    return NextResponse.json({ notes: [], unavailable: true });
  }
}
