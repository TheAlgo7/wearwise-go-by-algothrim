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
  WardrobeItem,
} from '@/types';
import {
  UNDERWEAR_BUFFER,
  TEMP_COLD,
  TEMP_COOL,
  TEMP_WARM,
  PLANE_LIQUID_ML_LIMIT,
  LONG_TRIP_NIGHTS,
} from './constants';
import { groomingType, isGenericName } from './item-display';

/**
 * The packing engine. Deterministic: the list is built here, in code, and the
 * model only writes a few notes about it afterwards (see /api/notes).
 *
 * September 2026 rebuild, driven by the one real trip the app has packed
 * (Ahmedabad, July). That list had to be hand-written into the database,
 * because the engine could not do what the trip needed:
 *
 * - It never saw his clothes. Clothing came from `travel_items`, which holds no
 *   clothing at all, so every list said "T-shirts / tops x4". His 120 Wardrobe
 *   pieces live in the same Supabase project; the engine now picks from them.
 * - Grooming listed every generic seed row next to the real product ("Face wash"
 *   and "The Derma Co. Kojic Face Wash", two sunscreens, two razors).
 * - "Don't forget" held 22 items, so it meant nothing. It is now the handful of
 *   things a trip genuinely fails without.
 * - Half the real notes read "MORNING: add after brushing". Those items are
 *   flagged `pack_last` and get their own group.
 * - Passport, visa, travel insurance and a plug adapter appeared on every
 *   trip, including Delhi to Ahmedabad. They now appear only when a
 *   destination is outside India.
 */

export interface EngineInput {
  trip:         Trip;
  travelItems:  TravelItem[];
  packingRules: PackingRule[];
  weather:      DestinationWeather[];
  /** His Wardrobe, read-only. Empty when it could not be loaded. */
  wardrobe?:    WardrobeItem[];
}

// ─── Per-destination analysis ────────────────────────────────────────────────

interface DestAnalysis {
  dest:   Destination;
  label:  string;
  tempC:  number;
  isCold: boolean;
  isCool: boolean;
  isHot:  boolean;
  rainy:  boolean;
  nights: number;
}

function analyzeDestinations(destinations: Destination[], weather: DestinationWeather[]): DestAnalysis[] {
  return destinations.map((dest, i) => {
    const cityName = dest.city.split(',')[0].trim().toLowerCase();
    const w = weather.find(w => w.city.toLowerCase().includes(cityName)) ?? weather[i];
    const tempC = w?.tempC ?? 22;
    return {
      dest,
      label:  dest.city.split(',')[0].trim(),
      tempC,
      isCold: tempC < TEMP_COLD,
      isCool: tempC < TEMP_COOL,
      isHot:  tempC >= TEMP_WARM,
      rainy:  /rain|drizzle|thunder|shower/i.test(w?.description ?? ''),
      nights: dest.nights,
    };
  });
}

/** Country code after the comma, e.g. "Goa,IN" -> "IN". Absent means India. */
function countryOf(city: string): string {
  return (city.split(',')[1] ?? 'IN').trim().toUpperCase() || 'IN';
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function buildPackingList(input: EngineInput): Omit<GeneratedPackingList, 'reasoning'> {
  const { trip, travelItems, packingRules, weather } = input;
  const wardrobe = input.wardrobe ?? [];

  // ── Context ────────────────────────────────────────────────────────────────
  const totalNights   = trip.destinations.reduce((s, d) => s + d.nights, 0);
  const isPlane       = trip.transport === 'plane';
  const isCar         = trip.transport === 'car';
  const isTrain       = trip.transport === 'train';
  const carryOnOnly   = isPlane && trip.carry_on_only;
  const isWork        = trip.is_work ?? false;
  const isMultiDest   = trip.destinations.length > 1;
  const international = trip.destinations.some(d => countryOf(d.city) !== 'IN');
  const drivingOwnCar = isCar && trip.vehicle_profile !== 'friends_car';

  const destAnalysis  = analyzeDestinations(trip.destinations, weather);
  const coldestDest   = destAnalysis.reduce((a, b) => (a.tempC < b.tempC ? a : b));
  const hottestDest   = destAnalysis.reduce((a, b) => (a.tempC > b.tempC ? a : b));

  const situations = trip.destinations
    .flatMap(d => (d.situation ? [d.situation.toLowerCase()] : []))
    .filter((s, i, a) => a.indexOf(s) === i);
  const hasAny = (tags: string[]) => situations.some(s => tags.includes(s));

  const hasBeach    = hasAny(['beach', 'resort', 'island', 'backwater', 'coastal', 'tropical', 'cruise']);
  const hasMountain = hasAny(['mountain', 'snow', 'cold', 'valley', 'hillstation', 'adventure', 'trekking', 'camping', 'border']);
  const hasBusiness = hasAny(['business', 'workation']) || isWork;
  const hasCold     = hasAny(['cold', 'snow']) || coldestDest.isCold;
  const hasSunny    = hasBeach || hasMountain || hasAny(['desert', 'royal', 'fort']) || hottestDest.isHot;
  const hasNature   = hasAny(['forest', 'wildlife', 'river', 'waterfall', 'lake', 'village', 'farmstay', 'monsoon']);
  const hasWellness = hasAny(['wellness', 'ayurveda']);
  const rainy       = destAnalysis.some(d => d.rainy) || hasAny(['monsoon']);
  const scenic      = hasBeach || hasMountain || hasNature || hasAny(['heritage', 'royal', 'fort', 'culture', 'offbeat', 'wildlife']);

  const item = (
    name: string, cat: PackingCategory, qty = 1,
    opts: { clothing?: boolean; notes?: string; dest?: string; priority?: PackingPriority; last?: boolean; image?: string | null; wardrobeId?: string | null } = {},
  ) => makeItem(trip.id, name, cat, qty, opts);

  // ── Critical: the few things the trip fails without ────────────────────────
  const critical: PackingItem[] = [];
  const crit = (name: string, cat: PackingCategory, notes?: string, extra: { qty?: number; clothing?: boolean; last?: boolean } = {}) =>
    critical.push(item(name, cat, extra.qty ?? 1, { notes, priority: 'critical', clothing: extra.clothing, last: extra.last }));

  if (international) {
    crit('Passport', 'documents', 'Valid six months past your return');
    crit('Visa / e-Visa', 'documents', 'Printed and saved offline');
  } else {
    crit('Government ID', 'documents', isPlane ? 'Must match the name on the ticket' : 'Aadhaar or licence');
  }
  if (drivingOwnCar) crit('Driving licence and car papers', 'documents', 'RC, insurance, PUC');
  crit('Wallet, cards and some cash', 'misc');
  if (isPlane)      crit('Boarding pass / e-ticket', 'documents', 'Screenshot it for offline');
  else if (!isCar)  crit('Tickets', 'documents', 'Screenshot them for offline');
  crit('Medicines', 'misc', 'Your regular ones, plus painkillers and a stomach tablet');

  if (hasBeach) crit('Swimwear', 'clothing', 'Easy to forget, pack it first', { qty: 2, clothing: true });
  if (hasCold || hasMountain) {
    crit('Thermals (top + bottom)', 'clothing', 'Non-negotiable for the cold stops', { qty: 2, clothing: true });
    crit('Gloves + beanie', 'clothing', undefined, { clothing: true });
  }
  if (hasBusiness) crit('Laptop charger', 'electronics', 'Still plugged in the night before', { last: true });

  // ── Clothing, from his Wardrobe ────────────────────────────────────────────
  const clothing = pickClothes(wardrobe, {
    tripId: trip.id,
    totalNights,
    temps: destAnalysis.map(d => d.tempC),
    coldestC: coldestDest.tempC,
    hottestC: hottestDest.tempC,
    isCar,
    hasBeach,
    hasMountain,
    hasCold,
    hasBusiness,
    hasSunny,
    situations,
    multiDestLabel: isMultiDest ? coldestDest.label : undefined,
  });

  clothing.push(item('Underwear', 'clothing', totalNights + UNDERWEAR_BUFFER, { clothing: true }));
  clothing.push(item('Socks', 'clothing', totalNights + 1, { clothing: true }));
  if (hasCold || hasMountain) {
    clothing.push(item('Warm socks (woollen)', 'clothing', Math.max(2, coldestDest.nights + 1), {
      clothing: true, dest: isMultiDest ? coldestDest.label : undefined,
    }));
  }
  if (hasWellness) {
    clothing.push(item('Loose comfortable clothes', 'clothing', 1, { clothing: true, notes: 'For wellness or ayurveda stays' }));
  }

  // ── Situational rules from the database ────────────────────────────────────
  // Clothing rules ("Formal shirt", "Belt", "Heavy jacket") are skipped when the
  // Wardrobe already put a real piece in that role, so a work trip does not get
  // two generic formal shirts on top of the two real ones it already picked.
  const covered = coveredRoles([...clothing, ...critical]);
  // Likewise a rule's "Sunscreen SPF50" when a real sunscreen is already packed.
  const groomingKinds = new Set(
    travelItems.filter(i => i.category === 'grooming').map(i => groomingType(i.name)),
  );
  const situationalClothing: PackingItem[] = [];
  const situationalMisc: PackingItem[] = [];
  for (const sit of situations) {
    for (const rule of packingRules.filter(r => r.situation === sit)) {
      const lower = rule.item_name.toLowerCase();
      if (critical.some(c => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()))) continue;
      const role = roleOf(lower);
      if (role && covered.has(role)) continue;
      if (groomingKinds.has(groomingType(rule.item_name)) && groomingType(rule.item_name) !== lower) continue;
      const isClothing = role !== null || /thermal|sock|glove|beanie|hat|scarf|jacket|fleece|boots|trousers|shirt/.test(lower);
      (isClothing ? situationalClothing : situationalMisc).push(
        item(rule.item_name, isClothing ? 'clothing' : 'misc', rule.quantity, { clothing: isClothing, notes: rule.notes ?? undefined }),
      );
    }
  }

  // ── Grooming: one of each thing, the travel-sized one ──────────────────────
  const grooming = pickGrooming(travelItems, { tripId: trip.id, isPlane, carryOnOnly });
  if (isTrain && totalNights >= 1) {
    grooming.push(item('Face wipes', 'grooming', 1, { notes: 'For the journey' }));
    grooming.push(item('Hand sanitiser', 'grooming'));
  }

  // ── Electronics ───────────────────────────────────────────────────────────
  const needsWorkKit = hasBusiness || totalNights >= LONG_TRIP_NIGHTS;
  const electronics: PackingItem[] = travelItems
    .filter(i => i.category === 'electronics')
    .filter(i => {
      const n = i.name.toLowerCase();
      if (i.tags.includes('work') || /laptop/.test(n)) return needsWorkKit;
      if (/adapter/.test(n)) return international;
      if (i.tags.includes('photography') || /camera/.test(n)) return scenic || totalNights >= 3;
      return true;
    })
    .map(i => {
      const n = i.name.toLowerCase();
      const last = /phone charger|power bank|laptop/.test(n);
      const notes =
        /power bank/.test(n) ? (isPlane ? 'Charge it overnight. Cabin bag only, never checked' : 'Charge it overnight')
        : isPlane && /laptop|camera|earphone|earbud/.test(n) ? 'Cabin bag'
        : undefined;
      return item(i.name, 'electronics', 1, { last, notes });
    });
  if (isCar) electronics.push(item('Car charger', 'electronics'));

  // ── Documents ─────────────────────────────────────────────────────────────
  const documents: PackingItem[] = travelItems
    .filter(i => i.category === 'documents')
    .filter(i => {
      const n = i.name.toLowerCase();
      if (/passport|visa|insurance/.test(n)) return international;
      return true;
    })
    .map(i => item(i.name, 'documents', 1, {
      notes: /booking/i.test(i.name) ? 'Hotel, transport, anything prepaid' : /emergency/i.test(i.name) ? 'Written down, not only in your phone' : undefined,
    }));

  // ── Misc ──────────────────────────────────────────────────────────────────
  const misc: PackingItem[] = [
    ...travelItems.filter(i => i.category === 'misc').map(i => item(i.name, 'misc')),
    item('Water bottle', 'misc', 1, { notes: isPlane ? 'Empty it before security, refill after' : undefined }),
    item('Small day bag', 'misc'),
    ...situationalMisc,
  ];
  if (totalNights >= 3) misc.push(item('Laundry bag', 'misc', 1, { notes: 'Dirty clothes away from clean ones' }));
  if (rainy)            misc.push(item('Compact umbrella', 'misc', 1, { notes: 'Rain is forecast', dest: isMultiDest ? destAnalysis.find(d => d.rainy)?.label : undefined }));
  if (rainy)            misc.push(item('Zip pouches', 'misc', 2, { notes: 'Keep electronics and papers dry' }));
  if (isCar) {
    misc.push(item('Snacks for the road', 'misc'));
    misc.push(item('Phone mount', 'misc'));
    if (trip.vehicle_profile === 'alto_k10' || trip.vehicle_profile === 'friends_car') {
      misc.push(item('Compact personal day bag', 'misc', 1, { notes: 'Keep essentials on you when space is tight' }));
    }
    if (trip.vehicle_profile === 'thar_roxx' || trip.vehicle_profile === 'fortuner_legender') {
      misc.push(item('Motion comfort kit', 'misc', 1, { notes: 'For the rough, bouncy stretches' }));
    }
  }
  if (isTrain) {
    misc.push(item('Travel pillow', 'misc'));
    misc.push(item('Earplugs or headphones', 'misc'));
    if (totalNights >= 1) misc.push(item('Snacks for the journey', 'misc'));
  }
  if (carryOnOnly) misc.push(item('Luggage scale', 'misc', 1, { notes: 'Check the cabin bag weight before leaving' }));
  if (hasSunny && !clothing.some(c => /sunglass/i.test(c.name))) misc.push(item('Sunglasses', 'misc'));
  if (hasMountain || hasCold) {
    misc.push(item('Lip balm', 'misc', 1, { notes: 'Cold air dries lips fast' }));
    misc.push(item('Sunscreen', 'misc', 1, { notes: 'UV bounces off snow and altitude' }));
  }
  if (hasNature) {
    misc.push(item('Mosquito repellent', 'misc'));
    misc.push(item('Light rain jacket / poncho', 'misc', 1, { notes: 'Weather flips fast outdoors' }));
  }

  return dedupeAcrossCategories({
    critical:    dedupeItems(critical),
    clothing:    dedupeItems([...clothing, ...situationalClothing]),
    grooming:    dedupeItems(grooming),
    electronics: dedupeItems(electronics),
    documents:   dedupeItems(documents),
    misc:        dedupeItems(misc),
  });
}

// ─── Clothes from the Wardrobe ───────────────────────────────────────────────

interface ClothesContext {
  tripId:      string;
  totalNights: number;
  temps:       number[];
  coldestC:    number;
  hottestC:    number;
  isCar:       boolean;
  hasBeach:    boolean;
  hasMountain: boolean;
  hasCold:     boolean;
  hasBusiness: boolean;
  hasSunny:    boolean;
  situations:  string[];
  multiDestLabel?: string;
}

const NEUTRALS = new Set(['black', 'white', 'grey', 'gray', 'charcoal', 'navy', 'beige', 'cream', 'tan', 'camel', 'sand', 'coffee', 'brown', 'olive']);

/** Categories that are homewear, not going-out bottoms (his rule, not a guess). */
const LOUNGE_CATEGORIES = new Set(['Lounge & Pyjama']);

/**
 * Real pieces, chosen the way he would: the weather decides what is possible,
 * formality decides what is right, and colour variety decides what makes the
 * cut, so four nights does not become four black tees.
 */
function pickClothes(wardrobe: WardrobeItem[], ctx: ClothesContext): PackingItem[] {
  const out: PackingItem[] = [];
  if (wardrobe.length === 0) return genericClothes(ctx);

  const cat = (w: WardrobeItem) => w.category?.name ?? '';
  const layer = (w: WardrobeItem) => w.category?.layer_type ?? '';

  // Weather decides what is possible. Wide temperature ranges are the norm in
  // his tags, so a small tolerance each side is enough.
  //
  // In the cold, tops, bottoms and loungewear ignore their lower bound: they
  // are worn under the jacket and thermals this same list adds. Without that,
  // an 11° Manali trip found no tee or shirt "warm enough" and fell back to
  // "T-shirts / tops x6" (the Wardrobe engine learned the same lesson: winter
  // skips the heat guard so layers stay in the pool).
  const layeringTrip = ctx.coldestC < TEMP_COOL;
  const layerable = (w: WardrobeItem) => ['base', 'bottom'].includes(layer(w));
  const suits = (w: WardrobeItem) =>
    ctx.temps.some(t => {
      const min = layeringTrip && layerable(w) ? -50 : (w.min_temp_c ?? -50);
      return min - 2 <= t && t <= (w.max_temp_c ?? 60) + 2;
    });

  const formalTarget =
    ctx.hasBusiness ? 3.5
    : ctx.situations.some(s => ['party', 'romantic', 'honeymoon', 'luxury'].includes(s)) ? 3
    : ctx.hasBeach || ctx.situations.some(s => ['trekking', 'camping', 'adventure'].includes(s)) ? 1.8
    : 2.5;

  const score = (w: WardrobeItem) => {
    let s = -Math.abs((w.formality ?? 2.5) - formalTarget);
    if (w.occasions.some(o => o === 'travel' || o === 'trip')) s += 0.4;
    if (w.vibe.includes('travel')) s += 0.3;
    if (ctx.hasBeach && w.vibe.includes('beach')) s += 0.5;
    if (w.vibe.includes('gym') && !ctx.situations.includes('adventure')) s -= 0.6;
    // His favourites (the plaque-buckle belts, for one) carry a `signature` tag in the Wardrobe.
    if (w.vibe.includes('signature')) s += 1;
    // Sleeves follow the weather: long when it is cool, short in real heat.
    const sleeve = w.sleeve_length ?? '';
    if (layeringTrip) s += sleeve === 'long' ? 0.8 : sleeve === 'short' ? -0.4 : 0;
    else if (ctx.hottestC >= 32) s += sleeve === 'short' ? 0.3 : sleeve === 'long' ? -0.2 : 0;
    return s;
  };

  /** Greedy pick that pays a price for repeating a colour. */
  const pickVaried = (pool: WardrobeItem[], n: number, used: Map<string, number>) => {
    const chosen: WardrobeItem[] = [];
    const left = [...pool];
    while (chosen.length < n && left.length > 0) {
      let bestIdx = 0;
      let best = -Infinity;
      left.forEach((w, i) => {
        const c = (w.primary_color ?? '').toLowerCase();
        const s = score(w) - 0.7 * (used.get(c) ?? 0);
        // Stable tie-break on name, so the same trip gives the same list.
        if (s > best || (s === best && w.name < left[bestIdx].name)) { best = s; bestIdx = i; }
      });
      const [w] = left.splice(bestIdx, 1);
      const c = (w.primary_color ?? '').toLowerCase();
      used.set(c, (used.get(c) ?? 0) + 1);
      chosen.push(w);
    }
    return chosen;
  };

  const fromWardrobe = (w: WardrobeItem, notes?: string, dest?: string) =>
    makeItem(ctx.tripId, w.name, 'clothing', 1, {
      clothing: true, notes, dest, image: w.image_url, wardrobeId: w.id,
    });

  const available = wardrobe.filter(suits);
  const colourUse = new Map<string, number>();

  // Tops: a day's top each night plus one spare (two by car, space is free).
  const topsNeeded = Math.min(ctx.totalNights + (ctx.isCar ? 2 : 1), 9);
  const shirts = available.filter(w => cat(w) === 'Shirt');
  const tees = available.filter(w => layer(w) === 'base' && cat(w) !== 'Shirt');
  const shirtShare = ctx.hasBusiness ? 0.7 : ctx.hasBeach ? 0.35 : 0.5;
  const wantShirts = Math.min(shirts.length, Math.round(topsNeeded * shirtShare));
  const pickedTops = [
    ...pickVaried(shirts, wantShirts, colourUse),
    ...pickVaried(tees, topsNeeded - wantShirts, colourUse),
  ];
  if (pickedTops.length < topsNeeded) {
    const extra = pickVaried(shirts.filter(s => !pickedTops.includes(s)), topsNeeded - pickedTops.length, colourUse);
    pickedTops.push(...extra);
  }
  out.push(...pickedTops.map(w => fromWardrobe(w)));
  if (pickedTops.length < topsNeeded) {
    out.push(makeItem(ctx.tripId, 'T-shirts / tops', 'clothing', topsNeeded - pickedTops.length, { clothing: true }));
  }

  // Bottoms: going-out bottoms only. Lounge and shorts are homewear by his rule.
  // A beach trip lives in shorts, so it takes one fewer pair of trousers.
  const bottomsNeeded = ctx.hasBeach
    ? Math.max(1, Math.min(Math.ceil(ctx.totalNights / 2), 3))
    : Math.min(Math.ceil(ctx.totalNights / 2) + 1, 4);
  const goingOut = available.filter(w => layer(w) === 'bottom' && !LOUNGE_CATEGORIES.has(cat(w)) && cat(w) !== 'Shorts');
  // Neutral bottoms pair with more of the tops, so they go first.
  const bottomColours = new Map<string, number>();
  const pickedBottoms = pickVaried(
    [...goingOut].sort((a, b) => Number(!NEUTRALS.has((a.primary_color ?? '').toLowerCase())) - Number(!NEUTRALS.has((b.primary_color ?? '').toLowerCase()))),
    bottomsNeeded,
    bottomColours,
  );
  out.push(...pickedBottoms.map(w => fromWardrobe(w)));
  if (pickedBottoms.length < bottomsNeeded) {
    out.push(makeItem(ctx.tripId, 'Trousers / jeans', 'clothing', bottomsNeeded - pickedBottoms.length, { clothing: true }));
  }
  if (ctx.hasBeach && ctx.hottestC >= 20) {
    const shorts = pickVaried(available.filter(w => cat(w) === 'Shorts'), ctx.totalNights >= 3 ? 2 : 1, new Map());
    out.push(...shorts.map(w => fromWardrobe(w)));
  }

  // Sleep and lounge.
  const lounge = available.filter(w => LOUNGE_CATEGORIES.has(cat(w)));
  const loungeNeeded = Math.min(Math.max(1, Math.ceil(ctx.totalNights / 3)), 2);
  const pickedLounge = pickVaried(lounge, loungeNeeded, new Map());
  out.push(...pickedLounge.map(w => fromWardrobe(w, 'Sleep and lounging')));
  if (pickedLounge.length === 0) out.push(makeItem(ctx.tripId, 'Sleepwear', 'clothing', loungeNeeded, { clothing: true }));

  // Layers for the coldest stop.
  if (ctx.coldestC < TEMP_COOL) {
    const jackets = wardrobe.filter(w => layer(w) === 'outer' && cat(w) !== 'Blazer');
    const jacket = jackets.sort((a, b) => score(b) - score(a))[0];
    const note = 'Wear it on the way, it takes the most space';
    if (jacket) out.push(fromWardrobe(jacket, note, ctx.multiDestLabel));
    else out.push(makeItem(ctx.tripId, ctx.coldestC < TEMP_COLD ? 'Heavy jacket' : 'Light jacket / hoodie', 'clothing', 1, { clothing: true, notes: note, dest: ctx.multiDestLabel }));
  }
  if (ctx.hasBusiness) {
    const blazer = wardrobe.find(w => cat(w) === 'Blazer');
    if (blazer) out.push(fromWardrobe(blazer));
  }

  // Footwear: one main pair, worn on the way; the rest by need.
  const byCat = (name: string) => wardrobe.filter(w => cat(w) === name).sort((a, b) => score(b) - score(a));
  const sneakers = byCat('Sneakers');
  const neutralSneaker = sneakers.find(w => NEUTRALS.has((w.primary_color ?? '').toLowerCase())) ?? sneakers[0];
  if (neutralSneaker) out.push(fromWardrobe(neutralSneaker, 'Main pair, wear them on the way'));
  else out.push(makeItem(ctx.tripId, 'Comfortable shoes', 'clothing', 1, { clothing: true }));
  if (ctx.hasBusiness) {
    const formal = byCat('Formal Shoes')[0];
    if (formal) out.push(fromWardrobe(formal));
  }
  if (ctx.hasCold || ctx.hasMountain) {
    const boots = byCat('Boots')[0];
    if (boots) out.push(fromWardrobe(boots, 'For cold or rough ground'));
    else out.push(makeItem(ctx.tripId, 'Warm boots', 'clothing', 1, { clothing: true }));
  }
  if (ctx.totalNights >= 2 || ctx.hasBeach) {
    const slides = byCat('Sandals / Slides')[0];
    if (slides) out.push(fromWardrobe(slides, 'For the room and the bathroom'));
    else if (ctx.hasBeach) out.push(makeItem(ctx.tripId, 'Flip-flops', 'clothing', 1, { clothing: true }));
  }

  // Accessories: one belt, one watch, sunglasses when it is bright.
  const belt = byCat('Belt').find(w => (w.primary_color ?? '').toLowerCase() === 'black') ?? byCat('Belt')[0];
  if (belt && pickedBottoms.length > 0) out.push(fromWardrobe(belt));
  const watch = byCat('Watch')[0];
  if (watch) out.push(fromWardrobe(watch));
  if (ctx.hasSunny) {
    const shades = byCat('Sunglasses')[0];
    if (shades) out.push(fromWardrobe(shades));
  }

  return out;
}

/** The old behaviour, kept for when the Wardrobe cannot be read. */
function genericClothes(ctx: ClothesContext): PackingItem[] {
  const tops = ctx.totalNights + (ctx.isCar ? 2 : 1);
  const bottoms = Math.max(1, Math.ceil(ctx.totalNights / 2)) + 1;
  const out = [
    makeItem(ctx.tripId, 'T-shirts / tops', 'clothing', tops, { clothing: true }),
    makeItem(ctx.tripId, 'Trousers / jeans', 'clothing', bottoms, { clothing: true }),
    makeItem(ctx.tripId, 'Sleepwear', 'clothing', Math.max(1, Math.ceil(ctx.totalNights / 3)), { clothing: true }),
    makeItem(ctx.tripId, 'Comfortable shoes', 'clothing', 1, { clothing: true, notes: 'Wear them on the way' }),
  ];
  if (ctx.coldestC < TEMP_COOL) out.push(makeItem(ctx.tripId, ctx.coldestC < TEMP_COLD ? 'Heavy jacket' : 'Light jacket / hoodie', 'clothing', 1, { clothing: true }));
  if (ctx.hasBusiness) out.push(makeItem(ctx.tripId, 'Formal shoes', 'clothing', 1, { clothing: true }), makeItem(ctx.tripId, 'Belt', 'clothing', 1, { clothing: true }));
  return out;
}

/** Which clothing roles a list already fills, so generic rules do not double them. */
function coveredRoles(clothing: PackingItem[]): Set<string> {
  const roles = new Set<string>();
  for (const c of clothing) {
    const role = roleOf(c.name.toLowerCase());
    if (role) roles.add(role);
  }
  return roles;
}

function roleOf(name: string): string | null {
  // His Blazer shelf holds a Nehru vest coat; that fills the rule's "Blazer".
  if (/blazer|nehru|waistcoat|vest coat/.test(name)) return 'blazer';
  if (/belt/.test(name)) return 'belt';
  if (/formal shoe|oxford|derby|loafer/.test(name)) return 'formal-shoes';
  if (/flip-?flop|slide|sandal/.test(name)) return 'slides';
  if (/thermal/.test(name)) return 'thermals';
  if (/wool(l)?en sock|warm sock|wool sock|hiking sock/.test(name)) return 'warm-socks';
  if (/beanie|gloves/.test(name)) return 'cold-accessories';
  if (/jacket|coat|hoodie/.test(name)) return 'jacket';
  if (/trouser|bootcut|jeans|chino|gurkha|cargo/.test(name)) return 'trousers';
  // After trousers, and on a word boundary, so "Bootcut" is never a boot.
  if (/\bboots?\b/.test(name)) return 'boots';
  if (/shirt/.test(name) && !/t-shirt|tee/.test(name)) return 'shirt';
  return null;
}

// ─── Grooming ────────────────────────────────────────────────────────────────

/**
 * One product per kind, the one worth carrying.
 *
 * A generic seed row ("Face wash") is dropped when a real product of the same
 * kind exists ("The Derma Co. 1% Kojic Acid Face Wash"). Where he owns two of
 * a kind (two sunscreens, two perfumes), the smaller bottle travels: it is what
 * he actually packed for Ahmedabad, and it is what a cabin bag allows.
 */
function pickGrooming(
  travelItems: TravelItem[],
  ctx: { tripId: string; isPlane: boolean; carryOnOnly: boolean },
): PackingItem[] {
  const products = travelItems.filter(i => i.category === 'grooming' && !i.is_clothing);
  const byType = new Map<string, TravelItem[]>();
  for (const p of products) {
    const t = groomingType(p.name);
    byType.set(t, [...(byType.get(t) ?? []), p]);
  }

  const out: PackingItem[] = [];
  for (const [, group] of byType) {
    const specific = group.filter(p => !isGenericName(p));
    const pool = specific.length > 0 ? specific : group;
    const chosen = [...pool].sort((a, b) => (a.size_ml ?? 999) - (b.size_ml ?? 999) || a.name.localeCompare(b.name))[0];
    out.push(makeItem(ctx.tripId, chosen.name, 'grooming', 1, {
      notes: liquidNote(chosen, ctx.isPlane, ctx.carryOnOnly),
      // Everything you still use the morning you leave. Nail clippers are the
      // rare grooming item that can go in the bag the night before.
      last: !/nail clipper/i.test(chosen.name),
    }));
  }
  return out;
}

/**
 * Carry-on liquid advisory for a grooming item, derived from its real `size_ml`
 * (falling back to a `liquid` tag when volume is unknown).
 */
function liquidNote(item: TravelItem, isPlane: boolean, carryOnOnly: boolean): string | undefined {
  if (!isPlane) return undefined;

  const ml = item.size_ml ?? null;
  const isLiquid = ml != null || item.tags.some(t => t.toLowerCase() === 'liquid');
  if (!isLiquid) return undefined;

  const limit = PLANE_LIQUID_ML_LIMIT;

  if (ml != null && ml > limit) {
    return carryOnOnly
      ? `${ml}ml, over the ${limit}ml limit. Decant it or check a bag`
      : `${ml}ml, checked bag only`;
  }
  if (ml != null) {
    return carryOnOnly ? `${ml}ml, cabin-safe` : undefined;
  }
  return carryOnOnly ? `Liquid, keep it under ${limit}ml in the cabin` : undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeItem(
  tripId: string,
  name: string,
  category: PackingCategory,
  quantity: number,
  opts: {
    clothing?: boolean; notes?: string; dest?: string; priority?: PackingPriority;
    last?: boolean; image?: string | null; wardrobeId?: string | null;
  } = {},
): PackingItem {
  return {
    id:                crypto.randomUUID(),
    trip_id:           tripId,
    category,
    name,
    quantity,
    packed:            false,
    is_clothing:       opts.clothing ?? false,
    priority:          opts.priority ?? 'normal',
    notes:             opts.notes ?? null,
    destination_label: opts.dest ?? null,
    pack_last:         opts.last ?? false,
    source:            'engine',
    image_url:         opts.image ?? null,
    wardrobe_item_id:  opts.wardrobeId ?? null,
  };
}

/**
 * Drop duplicates that span categories (dedupeItems only sees one category at a
 * time, so "Lip balm" could land in both grooming and misc). Earlier categories
 * win. A later item is also dropped when an earlier item's name contains it in
 * full, which catches a generic add ("Sunscreen" in misc) duplicating a real
 * product ("The Derma Co. ... Sunscreen ... SPF 50" in grooming) without
 * merging genuinely distinct items like "Warm socks" and "Socks".
 */
function dedupeAcrossCategories(
  list: Omit<GeneratedPackingList, 'reasoning'>,
): Omit<GeneratedPackingList, 'reasoning'> {
  const order = ['critical', 'clothing', 'grooming', 'electronics', 'documents', 'misc'] as const;
  const seen: string[] = [];

  const result = { ...list };
  for (const cat of order) {
    result[cat] = result[cat].filter(item => {
      const name = item.name.toLowerCase().trim();
      const dupe = seen.some(prev => prev === name || coversName(prev, name));
      if (!dupe) seen.push(name);
      return !dupe;
    });
  }
  return result;
}

/** Words that make a longer name a different thing: a laptop charger is not a laptop. */
const ACCESSORY_WORDS = /\b(charger|cable|case|cover|bag|pouch|stand|strap|mount|holder|adapter|kit|refill|scale|stick)\b/;

/**
 * True when `longer` is a specific version of `shorter` ("The Derma Co. ...
 * Sunscreen ... SPF 50" covers "Sunscreen"). Whole words only, and never when
 * the extra words make it an accessory: plain substring matching dropped
 * "Laptop" from every work trip because "Laptop charger" came first.
 */
function coversName(longer: string, shorter: string): boolean {
  const escaped = shorter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!new RegExp(`(^|\\W)${escaped}(\\W|$)`).test(longer)) return false;
  return !ACCESSORY_WORDS.test(longer.replace(shorter, ' '));
}

function dedupeItems(items: PackingItem[]): PackingItem[] {
  const seen = new Map<string, PackingItem>();
  for (const item of items) {
    const key = item.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (existing) {
      // A real Wardrobe piece picked twice is still one piece.
      seen.set(key, {
        ...existing,
        quantity: existing.wardrobe_item_id ? 1 : existing.quantity + item.quantity,
        priority: existing.priority === 'critical' || item.priority === 'critical' ? 'critical' : 'normal',
        pack_last: existing.pack_last || item.pack_last,
      });
    } else {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}
