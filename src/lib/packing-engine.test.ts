import { describe, expect, it } from 'vitest';
import type { DestinationWeather, PackingItem, TravelItem, Trip, WardrobeItem } from '@/types';
import { buildPackingList } from './packing-engine';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function trip(over: Partial<Trip> = {}): Trip {
  return {
    id: 'trip-1',
    name: 'Test trip',
    departure: '2026-12-01',
    transport: 'plane',
    vehicle_profile: null,
    destinations: [{ city: 'Goa,IN', nights: 4, situation: 'beach' }],
    carry_on_only: false,
    is_work: false,
    weather: null,
    packing_reasoning: null,
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    ...over,
  };
}

function wx(city: string, tempC: number, description = 'clear sky'): DestinationWeather {
  return { city, country: 'IN', tempC, feelsLikeC: tempC, description, humidity: 60, windKph: 8, icon: '01d' };
}

function travel(name: string, category: TravelItem['category'], extra: Partial<TravelItem> = {}): TravelItem {
  return { id: name, name, category, tags: [], is_clothing: false, created_at: '2026-01-01T00:00:00Z', ...extra };
}

function tee(name: string, colour: string): WardrobeItem {
  return {
    id: name, name, image_url: null, primary_color: colour, sleeve_length: 'short', formality: 2,
    min_temp_c: 18, max_temp_c: 40, vibe: ['casual'], occasions: [], category: { name: 'T-shirt', layer_type: 'base' },
  };
}

type List = ReturnType<typeof buildPackingList>;
const everything = (l: List): PackingItem[] => [...l.critical, ...l.clothing, ...l.grooming, ...l.electronics, ...l.documents, ...l.misc];
const names = (items: PackingItem[]) => items.map((i) => i.name);
const build = (t: Trip, extra: { travelItems?: TravelItem[]; weather?: DestinationWeather[]; wardrobe?: WardrobeItem[] } = {}) =>
  buildPackingList({
    trip: t,
    travelItems: extra.travelItems ?? [],
    packingRules: [],
    weather: extra.weather ?? [wx('Goa', 31)],
    wardrobe: extra.wardrobe,
  });

// ─── Documents follow the border ─────────────────────────────────────────────

describe('documents', () => {
  const kit = [
    travel('Passport', 'documents'),
    travel('Travel insurance', 'documents'),
    travel('Universal adapter', 'electronics'),
    travel('Phone charger', 'electronics'),
  ];

  it('a trip inside India carries ID and never a passport, visa, insurance or adapter', () => {
    const all = names(everything(build(trip(), { travelItems: kit })));
    expect(all).toContain('Government ID');
    expect(all).toContain('Phone charger');
    for (const n of ['Passport', 'Visa / e-Visa', 'Travel insurance', 'Universal adapter']) expect(all).not.toContain(n);
  });

  it('a stop outside India brings them, with the passport listed once', () => {
    const list = build(trip({ destinations: [{ city: 'Bangkok,TH', nights: 3 }] }), { travelItems: kit, weather: [wx('Bangkok', 32)] });
    const all = names(everything(list));
    expect(names(list.critical)).toEqual(expect.arrayContaining(['Passport', 'Visa / e-Visa']));
    expect(all.filter((n) => n === 'Passport')).toHaveLength(1);
    expect(all).toContain('Universal adapter');
    expect(all).not.toContain('Government ID');
  });
});

// ─── Situations and weather ──────────────────────────────────────────────────

describe('situations and weather', () => {
  it('a beach trip puts two swimwear first', () => {
    const swim = build(trip()).critical.find((i) => i.name === 'Swimwear');
    expect(swim?.quantity).toBe(2);
  });

  it('rain in the forecast adds an umbrella and zip pouches', () => {
    const misc = names(build(trip(), { weather: [wx('Goa', 27, 'light rain')] }).misc);
    expect(misc).toEqual(expect.arrayContaining(['Compact umbrella', 'Zip pouches']));
  });

  it('mountains bring thermals, gloves and a beanie', () => {
    const t = trip({ transport: 'car', vehicle_profile: 'curvv', destinations: [{ city: 'Manali,IN', nights: 3, situation: 'mountain' }] });
    const critical = names(build(t, { weather: [wx('Manali', 9)] }).critical);
    expect(critical).toEqual(expect.arrayContaining(['Thermals (top + bottom)', 'Gloves + beanie', 'Driving licence and car papers']));
  });
});

// ─── Grooming: one of each kind, the travel-sized one ────────────────────────

describe('grooming', () => {
  it('of two sunscreens, the smaller bottle travels', () => {
    const items = [
      travel('The Derma Co. Sunscreen SPF 50', 'grooming', { size_ml: 80 }),
      travel('Minimalist Sunscreen SPF 50', 'grooming', { size_ml: 50 }),
    ];
    expect(names(build(trip(), { travelItems: items }).grooming)).toEqual(['Minimalist Sunscreen SPF 50']);
  });

  it('a generic "Sunscreen" drops out when a real one is packed', () => {
    const t = trip({ destinations: [{ city: 'Manali,IN', nights: 3, situation: 'mountain' }] });
    const list = build(t, { travelItems: [travel('The Derma Co. Sunscreen SPF 50', 'grooming', { size_ml: 80 })], weather: [wx('Manali', 9)] });
    expect(names(list.grooming)).toContain('The Derma Co. Sunscreen SPF 50');
    expect(names(list.misc)).not.toContain('Sunscreen');
  });

  it('a carry-on flight flags liquids against the 100 ml rule', () => {
    const items = [
      travel('Cetaphil Face Wash', 'grooming', { size_ml: 125 }),
      travel('Minimalist Sunscreen SPF 50', 'grooming', { size_ml: 50 }),
    ];
    const grooming = build(trip({ carry_on_only: true }), { travelItems: items }).grooming;
    expect(grooming.find((i) => i.name === 'Cetaphil Face Wash')?.notes).toMatch(/over the 100ml limit/);
    expect(grooming.find((i) => i.name === 'Minimalist Sunscreen SPF 50')?.notes).toMatch(/cabin-safe/);
  });
});

// ─── Electronics ─────────────────────────────────────────────────────────────

describe('electronics', () => {
  it('a laptop charger does not swallow the laptop on a work trip', () => {
    const t = trip({ is_work: true, destinations: [{ city: 'Mumbai,IN', nights: 2, situation: 'business' }] });
    const list = build(t, { travelItems: [travel('Laptop', 'electronics', { tags: ['work'] })], weather: [wx('Mumbai', 30)] });
    const all = names(everything(list));
    expect(all).toContain('Laptop');
    expect(all).toContain('Laptop charger');
  });
});

// ─── Clothes come from the wardrobe ──────────────────────────────────────────

describe('clothes', () => {
  const wardrobe = [
    tee('Black Tee A', 'black'), tee('Black Tee B', 'black'), tee('Black Tee C', 'black'),
    tee('Black Tee D', 'black'), tee('Black Tee E', 'black'),
    tee('Navy Tee', 'navy'), tee('Olive Tee', 'olive'), tee('White Tee', 'white'),
  ];

  it('four nights is not four black tees', () => {
    const tops = build(trip({ destinations: [{ city: 'Goa,IN', nights: 4 }] }), { wardrobe }).clothing.filter((i) => i.wardrobe_item_id);
    expect(tops).toHaveLength(5); // a top a night plus a spare, flying
    const colours = tops.map((i) => wardrobe.find((w) => w.id === i.wardrobe_item_id)?.primary_color);
    expect(colours.filter((c) => c === 'black').length).toBeLessThanOrEqual(2);
    expect(new Set(colours).size).toBeGreaterThanOrEqual(4);
  });

  it('the same trip gives the same list', () => {
    const t = trip({ destinations: [{ city: 'Goa,IN', nights: 4 }] });
    expect(names(everything(build(t, { wardrobe })))).toEqual(names(everything(build(t, { wardrobe }))));
  });
});
