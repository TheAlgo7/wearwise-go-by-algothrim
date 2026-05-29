import type {
  Trip,
  TravelItem,
  PackingRule,
  DestinationWeather,
  GeneratedPackingList,
  PackingItem,
  PackingCategory,
  PackingPriority,
  Destination,
} from '@/types';
import { getVehicleProfileInfo } from './vehicles';
import {
  OUTFIT_BUFFER,
  UNDERWEAR_BUFFER,
  TEMP_COLD,
  TEMP_COOL,
  TEMP_WARM,
  PLANE_LIQUID_ML_LIMIT,
  LONG_TRIP_NIGHTS,
} from './constants';

export interface EngineInput {
  trip:         Trip;
  travelItems:  TravelItem[];
  packingRules: PackingRule[];
  weather:      DestinationWeather[];
}

// ─── Per-destination analysis ────────────────────────────────────────────────

interface DestAnalysis {
  dest:      Destination;
  label:     string;
  tempC:     number;
  isCold:    boolean;
  isCool:    boolean;
  isHot:     boolean;
  nights:    number;
}

function analyzeDestinations(destinations: Destination[], weather: DestinationWeather[]): DestAnalysis[] {
  return destinations.map((dest, i) => {
    const cityName = dest.city.split(',')[0].toLowerCase();
    const w = weather.find(w => w.city.toLowerCase().includes(cityName)) ?? weather[i];
    const tempC = w?.tempC ?? 22;
    return {
      dest,
      label:  dest.city.split(',')[0],
      tempC,
      isCold: tempC < TEMP_COLD,
      isCool: tempC < TEMP_COOL,
      isHot:  tempC >= TEMP_WARM,
      nights: dest.nights,
    };
  });
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function buildPackingList(input: EngineInput): Omit<GeneratedPackingList, 'reasoning'> {
  const { trip, travelItems, packingRules, weather } = input;

  // ── Context ────────────────────────────────────────────────────────────────
  const totalNights    = trip.destinations.reduce((s, d) => s + d.nights, 0);
  const isPlane        = trip.transport === 'plane';
  const isCar          = trip.transport === 'car';
  const isTrain        = trip.transport === 'train';
  const carryOnOnly    = trip.carry_on_only;
  const isWork         = trip.is_work ?? false;
  const isMultiDest    = trip.destinations.length > 1;
  const vehicleInfo    = isCar ? getVehicleProfileInfo(trip.vehicle_profile) : undefined;

  const destAnalysis   = analyzeDestinations(trip.destinations, weather);
  const coldestDest    = destAnalysis.reduce((a, b) => a.tempC < b.tempC ? a : b);
  const hottestDest    = destAnalysis.reduce((a, b) => a.tempC > b.tempC ? a : b);

  const situations     = trip.destinations
    .flatMap(d => d.situation ? [d.situation] : [])
    .map(s => s.toLowerCase())
    .filter((s, i, a) => a.indexOf(s) === i);

  const hasAny = (tags: string[]) => situations.some(s => tags.includes(s));

  const hasBeach    = hasAny(['beach', 'resort', 'island', 'backwater', 'coastal', 'tropical', 'cruise']);
  const hasMountain = hasAny(['mountain', 'snow', 'cold', 'valley', 'hillstation', 'adventure', 'trekking', 'camping', 'border']);
  const hasBusiness = hasAny(['business', 'workation']) || isWork;
  const hasCold     = hasAny(['cold', 'snow']) || coldestDest.isCold;
  const hasSunny    = hasBeach || hasMountain || hasAny(['desert', 'royal', 'fort']) || hottestDest.isHot;
  const hasNature   = hasAny(['forest', 'wildlife', 'river', 'waterfall', 'lake', 'village', 'farmstay', 'monsoon']);
  const hasWellness = hasAny(['wellness', 'ayurveda']);

  const wardrobeClothing = travelItems.filter(i => i.is_clothing);

  // ── Critical — Don't Forget ────────────────────────────────────────────────
  const critical: PackingItem[] = [];

  const crit = (name: string, cat: PackingCategory, qty = 1, isClothing = false, notes?: string) =>
    critical.push(makeItem(trip.id, name, cat, qty, isClothing, notes, undefined, 'critical'));

  // Non-negotiables
  crit('Power bank',              'electronics', 1, false, 'Charge the night before');
  crit('Phone charger',           'electronics', 1, false);
  crit('Wallet + cash',           'misc',        1, false);
  crit(isPlane ? 'Passport' : 'Government ID / Aadhaar', 'documents', 1, false);
  crit('Toothbrush',              'grooming',    1, false);
  crit('Medicines / supplements', 'misc',        1, false, 'If applicable — do not forget');

  // Situational critical
  if (hasBeach || situations.includes('resort')) {
    crit('Swimwear', 'clothing', 2, true, 'Easy to forget — pack this first');
  }
  if (hasCold || hasMountain) {
    crit('Thermals (top + bottom)', 'clothing', 2, true, 'Non-negotiable for cold stops');
    crit('Gloves + beanie',         'clothing', 1, true);
  }
  if (hasSunny || hasMountain) {
    crit('Sunglasses', 'misc', 1, false, hasMountain ? 'Snow glare is intense' : undefined);
  }
  if (hasNature) {
    crit('Mosquito repellent', 'misc', 1, false, 'Useful for forest, lake, farmstay, and monsoon stops');
  }
  if (isPlane) {
    crit('Boarding pass / e-ticket', 'documents', 1, false, 'Screenshot offline or print');
  }
  if (hasBusiness) {
    crit('Laptop charger', 'electronics', 1, false);
  }
  if (isTrain && totalNights >= 1) {
    crit('Snacks for the journey', 'misc', 1, false);
  }

  // ── Clothing ──────────────────────────────────────────────────────────────
  const clothing: PackingItem[] = [];

  const outfitBuffer    = isCar ? OUTFIT_BUFFER + 1 : OUTFIT_BUFFER;
  const topsNeeded      = totalNights + outfitBuffer;
  const bottomsNeeded   = Math.max(1, Math.ceil(totalNights / 2)) + outfitBuffer;
  const underwearNeeded = totalNights + UNDERWEAR_BUFFER;
  const socksNeeded     = totalNights + UNDERWEAR_BUFFER;
  const sleepwearSets   = Math.max(1, Math.ceil(totalNights / 3));

  // Tops from wardrobe
  const baseTops = wardrobeClothing.filter(i => i.layer === 'base');
  const selectedTops = baseTops.slice(0, topsNeeded);
  selectedTops.forEach(item => clothing.push(makeItem(trip.id, item.name, 'clothing', 1, true)));
  if (selectedTops.length < topsNeeded) {
    clothing.push(makeItem(trip.id, 'T-shirts / tops', 'clothing', topsNeeded - selectedTops.length, true));
  }

  // Bottoms
  const bottoms = wardrobeClothing.filter(i => i.layer === 'bottom');
  const selectedBottoms = bottoms.slice(0, bottomsNeeded);
  selectedBottoms.forEach(item => clothing.push(makeItem(trip.id, item.name, 'clothing', 1, true)));
  if (selectedBottoms.length < bottomsNeeded) {
    clothing.push(makeItem(trip.id, 'Trousers / jeans', 'clothing', bottomsNeeded - selectedBottoms.length, true));
  }

  // Underwear + socks
  clothing.push(makeItem(trip.id, 'Underwear',  'clothing', underwearNeeded, true));
  clothing.push(makeItem(trip.id, 'Socks',      'clothing', socksNeeded,     true));

  // Sleepwear — always
  clothing.push(makeItem(trip.id, 'Sleepwear / lounge clothes', 'clothing', sleepwearSets, true));

  // Per-destination layering (with destination label if multi-stop)
  const midLayers   = wardrobeClothing.filter(i => i.layer === 'mid');
  const outerLayers = wardrobeClothing.filter(i => i.layer === 'outer');

  let midAdded   = false;
  let outerAdded = false;

  destAnalysis.forEach(da => {
    // Only label if multi-destination
    const label = isMultiDest ? da.label : undefined;

    if (da.isCold && !outerAdded) {
      const outer = outerLayers[0];
      clothing.push(makeItem(trip.id, outer?.name ?? 'Heavy jacket / winter coat', 'clothing', 1, true, undefined, label));
      outerAdded = true;
    }
    if (da.isCold && !midAdded) {
      clothing.push(makeItem(trip.id, 'Warm socks (woollen)', 'clothing', Math.max(2, da.nights + 1), true, undefined, label));
    }
    if (da.isCool && !midAdded && !da.isCold) {
      const mid = midLayers[0];
      clothing.push(makeItem(trip.id, mid?.name ?? 'Light jacket / hoodie', 'clothing', 1, true, undefined, label));
      midAdded = true;
    }
    if (da.isCold && !midAdded) {
      const mid = midLayers[0];
      clothing.push(makeItem(trip.id, mid?.name ?? 'Fleece / thermal mid-layer', 'clothing', 1, true, undefined, label));
      midAdded = true;
    }
  });

  // Footwear
  const footwear = wardrobeClothing.filter(i => i.layer === 'footwear');
  clothing.push(makeItem(trip.id, footwear[0]?.name ?? 'Comfortable shoes / sneakers', 'clothing', 1, true));
  if (hasMountain || hasCold) {
    clothing.push(makeItem(trip.id, 'Warm boots / sturdy footwear', 'clothing', 1, true, 'Essential for cold terrain'));
  }
  if (hasBeach) {
    clothing.push(makeItem(trip.id, 'Flip-flops / sandals', 'clothing', 1, true));
  }
  if (isCar && totalNights >= 3) {
    clothing.push(makeItem(trip.id, 'Backup footwear', 'clothing', 1, true, 'Car allows the extra space'));
  }

  // Business formals
  if (hasBusiness) {
    clothing.push(makeItem(trip.id, 'Formal shirt / outfit', 'clothing', 2, true));
    clothing.push(makeItem(trip.id, 'Formal shoes', 'clothing', 1, true));
    clothing.push(makeItem(trip.id, 'Belt', 'clothing', 1, true));
  }

  // ── Situational rules from DB ─────────────────────────────────────────────
  const situationalClothing: PackingItem[] = [];
  const situationalMisc:     PackingItem[] = [];

  for (const sit of situations) {
    packingRules.filter(r => r.situation === sit).forEach(rule => {
      // Skip items already covered by critical section
      const inCritical = critical.some(c => c.name.toLowerCase().includes(rule.item_name.toLowerCase()));
      if (inCritical) return;

      const isClothing = wardrobeClothing.some(i =>
        i.name.toLowerCase().includes(rule.item_name.toLowerCase()),
      );
      const target = isClothing ? situationalClothing : situationalMisc;
      target.push(makeItem(trip.id, rule.item_name, isClothing ? 'clothing' : 'misc', rule.quantity, isClothing, rule.notes ?? undefined));
    });
  }

  // ── Grooming ─────────────────────────────────────────────────────────────
  const groomingItems = travelItems.filter(i => i.category === 'grooming' && !i.is_clothing);
  let grooming: PackingItem[] = groomingItems
    .filter(i => !critical.some(c => c.name.toLowerCase().includes(i.name.toLowerCase())))
    .map(i => makeItem(trip.id, i.name, 'grooming', 1, false));

  // Train overnight hygiene extras
  if (isTrain && totalNights >= 1) {
    grooming.push(makeItem(trip.id, 'Face wipes',       'grooming', 1, false, 'For the journey'));
    grooming.push(makeItem(trip.id, 'Hand sanitiser',   'grooming', 1, false));
    grooming.push(makeItem(trip.id, 'Travel towel',     'grooming', 1, false, 'For overnight comfort'));
  }

  // Plane liquid limits
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
  const electronics: PackingItem[] = electronicsItems
    .filter(i => !critical.some(c => c.name.toLowerCase().includes(i.name.toLowerCase())))
    .map(i => makeItem(trip.id, i.name, 'electronics', 1, false));

  // Conditional laptop
  const needsLaptop = isWork || hasBusiness || totalNights >= LONG_TRIP_NIGHTS;
  if (needsLaptop && !electronics.some(e => e.name.toLowerCase().includes('laptop'))) {
    electronics.push(makeItem(trip.id, 'Laptop', 'electronics', 1, false));
  }

  // Universal adapter for flights or long trips
  if (isPlane || totalNights >= 5) {
    electronics.push(makeItem(trip.id, 'Universal travel adapter', 'electronics', 1, false));
  }

  // Car charger
  if (isCar) {
    electronics.push(makeItem(trip.id, 'Car charger / USB adapter', 'electronics', 1, false));
  }

  // Plane: note what goes in cabin bag
  if (isPlane) {
    electronics.forEach(item => {
      if (['laptop', 'camera', 'earphone', 'earbud'].some(k => item.name.toLowerCase().includes(k))) {
        item.notes = (item.notes ? `${item.notes} · ` : '') + 'cabin bag';
      }
    });
  }

  // ── Documents ─────────────────────────────────────────────────────────────
  const documentItems = travelItems.filter(i => i.category === 'documents');
  const documents: PackingItem[] = documentItems
    .filter(i => !critical.some(c => c.name.toLowerCase().includes(i.name.toLowerCase())))
    .map(i => makeItem(trip.id, i.name, 'documents', 1, false));

  documents.push(makeItem(trip.id, 'Booking confirmations', 'documents', 1, false, 'Hotel, transport, activities'));
  documents.push(makeItem(trip.id, 'Emergency contacts',    'documents', 1, false, 'Written down, not just in phone'));

  if (isPlane) {
    documents.push(makeItem(trip.id, 'Travel insurance',    'documents', 1, false));
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  const miscItems = travelItems.filter(i => i.category === 'misc');
  const misc: PackingItem[] = [
    ...miscItems
      .filter(i => !critical.some(c => c.name.toLowerCase().includes(i.name.toLowerCase())))
      .map(i => makeItem(trip.id, i.name, 'misc', 1, false)),
    makeItem(trip.id, 'Reusable water bottle',     'misc', 1, false),
    makeItem(trip.id, 'Small backpack / daypack',  'misc', 1, false),
    ...situationalMisc.filter(i => !critical.some(c => c.name.toLowerCase().includes(i.name.toLowerCase()))),
  ];

  // Transport-specific misc
  if (isCar) {
    misc.push(makeItem(trip.id, 'Snacks for the road',    'misc', 1, false));
    misc.push(makeItem(trip.id, 'Aux cable / phone mount', 'misc', 1, false));
    if (vehicleInfo) {
      misc.push(makeItem(trip.id, `${vehicleInfo.shortLabel} road setup`, 'misc', 1, false, vehicleInfo.packingNote));
    }
    if (trip.vehicle_profile === 'alto_k10' || trip.vehicle_profile === 'friends_car') {
      misc.push(makeItem(trip.id, 'Compact personal day bag', 'misc', 1, false, 'Keep essentials with you if boot or cabin space is limited'));
    }
    if (trip.vehicle_profile === 'thar_roxx' || trip.vehicle_profile === 'fortuner_legender') {
      misc.push(makeItem(trip.id, 'Motion comfort kit', 'misc', 1, false, 'Useful on rough roads or bouncy low-speed sections'));
    }
  }
  if (isTrain) {
    misc.push(makeItem(trip.id, 'Travel pillow / neck pillow',             'misc', 1, false));
    misc.push(makeItem(trip.id, 'Earplugs or headphones',                  'misc', 1, false));
  }
  if (isPlane && carryOnOnly) {
    misc.push(makeItem(trip.id, 'Luggage scale', 'misc', 1, false, 'Verify carry-on weight before leaving'));
  }
  if (hasMountain || hasCold) {
    misc.push(makeItem(trip.id, 'Lip balm',    'misc', 1, false, 'Cold air dries lips fast'));
    misc.push(makeItem(trip.id, 'Sunscreen',   'misc', 1, false, 'UV reflection in snow/altitude'));
  }
  if (hasNature) {
    misc.push(makeItem(trip.id, 'Light rain jacket / poncho', 'misc', 1, false, 'Weather can flip fast outdoors'));
  }
  if (hasWellness) {
    clothing.push(makeItem(trip.id, 'Loose comfortable clothes', 'clothing', 1, true, 'Better for wellness or ayurveda stays'));
  }

  return {
    critical:    dedupeItems(critical),
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
  destinationLabel?: string,
  priority: PackingPriority = 'normal',
): PackingItem {
  return {
    id:                crypto.randomUUID(),
    trip_id:           tripId,
    category,
    name,
    quantity,
    packed:            false,
    is_clothing:       isClothing,
    priority,
    notes,
    destination_label: destinationLabel,
  };
}

function dedupeItems(items: PackingItem[]): PackingItem[] {
  const seen = new Map<string, PackingItem>();
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      // Keep higher priority, merge quantity
      seen.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
        priority: existing.priority === 'critical' || item.priority === 'critical' ? 'critical' : 'normal',
      });
    } else {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}
