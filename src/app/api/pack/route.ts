import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildPackingList } from '@/lib/packing-engine';
import { buildPackingPrompt } from '@/lib/prompts';
import { chat } from '@/lib/llm';
import type { Trip, TravelItem, PackingRule, DestinationWeather } from '@/types';

interface PackRequestBody {
  trip:    Trip;
  weather: DestinationWeather[];
}

export async function POST(req: NextRequest) {
  let body: PackRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { trip, weather } = body;
  if (!trip || !weather) {
    return NextResponse.json({ error: 'trip and weather required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Fetch travel items + packing rules from Supabase
  const [itemsRes, rulesRes] = await Promise.all([
    supabase.from('travel_items').select('*'),
    supabase.from('packing_rules').select('*'),
  ]);

  if (itemsRes.error) {
    return NextResponse.json({ error: itemsRes.error.message }, { status: 502 });
  }

  const travelItems  = (itemsRes.data ?? []) as TravelItem[];
  const packingRules = (rulesRes.data ?? []) as PackingRule[];

  // Run deterministic engine
  const engineList = buildPackingList({ trip, travelItems, packingRules, weather });

  // Run AI review
  let reasoning = '';
  try {
    const promptJson = buildPackingPrompt(trip, weather, engineList);
    const { system, user } = JSON.parse(promptJson) as { system: string; user: string };
    reasoning = await chat([
      { role: 'system', content: system },
      { role: 'user',   content: user },
    ]);
  } catch {
    reasoning = 'AI review unavailable — list generated from your wardrobe data.';
  }

  const packingList = { ...engineList, reasoning };

  // Persist to Supabase
  const allItems = [
    ...packingList.critical,
    ...packingList.clothing,
    ...packingList.grooming,
    ...packingList.electronics,
    ...packingList.documents,
    ...packingList.misc,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ].map(({ id: _id, ...rest }) => rest); // let Supabase generate IDs

  const { error: insertError } = await supabase
    .from('packing_lists')
    .insert(allItems);

  if (insertError) {
    return NextResponse.json({ error: `Failed to save packing list: ${insertError.message}` }, { status: 502 });
  }

  return NextResponse.json({ packingList });
}
