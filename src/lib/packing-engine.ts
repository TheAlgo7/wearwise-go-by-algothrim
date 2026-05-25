import type {
  Trip,
  TravelItem,
  PackingRule,
  DestinationWeather,
  GeneratedPackingList,
  PackingItem,
  PackingCategory,
} from '@/types';
import {
  OUTFIT_BUFFER,
  UNDERWEAR_BUFFER,
  TEMP_COLD,
  TEMP_COOL,
  PLANE_LIQUID_ML_LIMIT,
} from './constants';

// ─── Deterministic packing list from wardrobe + rules ────────────────────────

export interface EngineInput {
  trip:         Trip;
  travelItems:  TravelItem[];
  packingRules: PackingRule[];
  weather:      DestinationWeather[];
}

export function buildPackingList(input: EngineInput): Omit<GeneratedPackingList, 'reasoning'> {
  const { trip, travelItems, packingRules, weather } = input;

  const totalNights = trip.destinations.reduce((sum, d) => sum + d.nights, 0);
  const coldestTempC = weather.length
    ? Math.min(...weather.map(w => w.tempC))
    : 20;

  const situations = trip.destinations
    .flatMap(d => (d.situation ? [d.situation] : []))
    .filter((s, i, arr) => arr.indexOf(s) === i);

  const isPlane      = trip.transport === 'plane';
  const isCold       = coldestTempC < TEMP_COLD;
  const isCool       = coldestTempC < TEMP_COOL;

  // ── Clothing ──────────────────────────────────────────────────────────────
  const clothing: PackingItem[] = [];

  // Filter wardrobe clothing by warmth/cold appropriateness
  const wardrobeClothing = travelItems.filter(i => i.is_clothing);
  const outerLayers = wardrobeClothing.filter(i => i.layer === 'outer');
  const midLayers   = wardrobeClothing.filter(i => i.layer === 'mid');
  const baseTops    = wardrobeClothing.filter(i => i.layer === 'base');
  const bottoms     = wardrobeClothing.filter(i => i.layer === 'bottom');
  const footwear    = wardrobeClothing.filter(i => i.layer === 'footwear');

  const topsNeeded       = totalNights + OUTFIT_BUFFER;
  const bottomsNeeded    = Math.max(1, Math.ceil(totalNights / 2)) + OUTFIT_BUFFER;
  const underwearNeeded  = totalNights + UNDERWEAR_BUFFER;
  const socksNeeded      = totalNights + UNDERWEAR_BUFFER;

  // Add base tops from wardrobe
  const selectedTops = baseTops.slice(0, topsNeeded);
  selectedTops.forEach(item => {
    clothing.push(makeItem(trip.id, item.name, 'clothing', 1, true));
  });
  // Fill remaining with generic if wardrobe doesn't have enough
  if (selectedTops.length < topsNeeded) {
    const remaining = topsNeeded - selectedTops.length;
    clothing.push(makeItem(trip.id, 'T-shirts / tops', 'clothing', remaining, true));
  }

  // Bottoms
  const selectedBottoms = bottoms.slice(0, bottomsNeeded);
  selectedBottoms.forEach(item => {
    clothing.push(makeItem(trip.id, item.name, 'clothing', 1, true));
  });
  if (selectedBottoms.length < bottomsNeeded) {
    clothing.push(makeItem(trip.id, 'Trousers / jeans', 'clothing', bottomsNeeded - selectedBottoms.length, true));
  }

  // Underwear + socks (always generic quantity items)
  clothing.push(makeItem(trip.id, 'Underwear',  'clothing', underwearNeeded, true));
  clothing.push(makeItem(trip.id, 'Socks',      'clothing', socksNeeded,     true));

  // Mid + outer layers for cool/cold
  if (isCool || isCold) {
    const mid = midLayers[0];
    clothing.push(makeItem(trip.id, mid?.name ?? 'Light jacket / hoodie', 'clothing', 1, true));
  }
  if (isCold) {
    const outer = outerLayers[0];
    clothing.push(makeItem(trip.id, outer?.name ?? 'Heavy jacket', 'clothing', 1, true));
    clothing.push(makeItem(trip.id, 'Thermal base layer (top + bottom)', 'clothing', 2, true));
  }

  // Footwear
  const shoe = footwear[0];
  clothing.push(makeItem(trip.id, shoe?.name ?? 'Comfortable shoes', 'clothing', 1, true));

  // ── Situational extras ────────────────────────────────────────────────────
  const situationalClothing: PackingItem[] = [];
  const situationalMisc:     PackingItem[] = [];

  for (const sit of situations) {
    const rules = packingRules.filter(r => r.situation === sit);
    rules.forEach(rule => {
      const isClothing = wardrobeClothing.some(i =>
        i.name.toLowerCase().includes(rule.item_name.toLowerCase()),
      );
      const target = isClothing ? situationalClothing : situationalMisc;
      target.push(makeItem(trip.id, rule.item_name, isClothing ? 'clothing' : 'misc', rule.quantity, isClothing, rule.notes ?? undefined));
    });
  }

  // ── Grooming ─────────────────────────────────────────────────────────────
  const groomingItems = travelItems.filter(i => i.category === 'grooming' && !i.is_clothing);
  let grooming: PackingItem[] = groomingItems.map(i =>
    makeItem(trip.id, i.name, 'grooming', 1, false),
  );

  // Plane liquid rule: add note if liquids might exceed 100ml
  if (isPlane) {
    grooming = grooming.map(item => ({
      ...item,
      notes: item.notes
        ? `${item.notes} — max ${PLANE_LIQUID_ML_LIMIT}ml`
        : `max ${PLANE_LIQUID_ML_LIMIT}ml (carry-on)`,
    }));
  }

  // ── Electronics ───────────────────────────────────────────────────────────
  const electronicsItems = travelItems.filter(i => i.category === 'electronics');
  const electronics: PackingItem[] = electronicsItems.map(i =>
    makeItem(trip.id, i.name, 'electronics', 1, false),
  );

  // ── Documents ─────────────────────────────────────────────────────────────
  const documentItems = travelItems.filter(i => i.category === 'documents');
  const documents: PackingItem[] = documentItems.map(i =>
    makeItem(trip.id, i.name, 'documents', 1, false),
  );

  // Always include passport if travelling by plane
  if (isPlane && !documents.some(d => d.name.toLowerCase().includes('passport'))) {
    documents.unshift(makeItem(trip.id, 'Passport', 'documents', 1, false));
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  const miscItems = travelItems.filter(i => i.category === 'misc');
  const misc: PackingItem[] = [
    ...miscItems.map(i => makeItem(trip.id, i.name, 'misc', 1, false)),
    makeItem(trip.id, 'Reusable water bottle', 'misc', 1, false),
    makeItem(trip.id, 'Small backpack / daypack', 'misc', 1, false),
    ...situationalMisc,
  ];

  return {
    clothing:    dedupeItems([...clothing, ...situationalClothing]),
    grooming:    dedupeItems(grooming),
    electronics: dedupeItems(electronics),
    documents:   dedupeItems(documents),
    misc:        dedupeItems(misc),
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeItem(
  tripId: string,
  name: string,
  category: PackingCategory,
  quantity: number,
  isClothing: boolean,
  notes?: string,
): PackingItem {
  return {
    id:          crypto.randomUUID(),
    trip_id:     tripId,
    category,
    name,
    quantity,
    packed:      false,
    is_clothing: isClothing,
    notes,
  };
}

function dedupeItems(items: PackingItem[]): PackingItem[] {
  const seen = new Map<string, PackingItem>();
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      seen.set(key, { ...existing, quantity: existing.quantity + item.quantity });
    } else {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}
