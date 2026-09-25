# Design System: WearWise Go

## Theme

Dark, AMOLED black canvas, night-blue surfaces. The physical scene is packing the night before a trip, and the morning of: a bedroom or a hotel room, the phone propped on the bed while things go into a bag. The list has to be readable at arm's length and tickable one-handed.

Colour strategy: **Restrained**. Blue-tinted neutrals everywhere; the cornflower accent (`#6B9FED`) marks the one primary action on a screen, the progress bar, ticks, focus, and nothing decorative. Copper (`amber-*`, rendered copper) means time pressure only: leaving today or tomorrow, and the "Don't forget" group.

Shared vocabulary with WearWise Wardrobe (September 2026 pass): same OKLCH method, same neutral selection state, same photo plates, same liquid-glass nav. Wardrobe is crimson on warm ink; Go is blue on cold ink.

### Where blue is allowed

| Use | Token |
|---|---|
| Primary action (Build my list, Continue packing, Save, New trip +) | `bg-blue-400`, **`text-ink-0`** (7.8:1; white on this blue is under 3:1) |
| Progress fill, ticked circle | `blue-400` |
| Focus ring | `blue-400` |
| "Notes from Go" label (AI content) | `blue-300` |
| Selected segment, chip, transport tile | **not blue**: raised `ink-500`, `fog-100` text |
| Active nav tab | **not blue**: `white/[0.12]`; the + beside it is the bar's only solid blue |

---

## Colour

Rebuilt in OKLCH on the accent's hue (258) in September 2026. The old scale was flat grey-navy with `ink-200` and `ink-300` barely apart, and `fog-600`, used for every item note, sat under 3:1.

### Ink

| Token | Hex | OKLCH | Role |
|---|---|---|---|
| `ink-0` | `#000000` | | Canvas |
| `ink-100` | `#090D14` | 16% 0.016 258 | Sheets |
| `ink-200` | `#10161F` | 20% 0.020 258 | Cards, grouped lists |
| `ink-300` | `#181E29` | 23.5% 0.022 258 | Inputs, toasts |
| `ink-400` | `#202834` | 27.5% 0.024 258 | Progress track |
| `ink-500` | `#2D3643` | 33% 0.026 258 | Selected segment / chip / tile |
| `ink-600` | `#3E4857` | 40% 0.028 258 | Strong borders |

### Fog

| Token | Hex | On `ink-200` | Role |
|---|---|---|---|
| `fog-100` | `#EEF2F7` | 16:1 | Primary text |
| `fog-200` | `#CCD5E2` | 11:1 | Secondary |
| `fog-300` | `#A9B5C8` | 8.8:1 | Tertiary, inactive labels |
| `fog-400` | `#8996AB` | 6.1:1 | Notes, metadata, counts |
| `fog-500` | `#6B788C` | 4.1:1 | Icons, placeholders, empty circles |
| `fog-600` | `#556173` | 2.9:1 | Decorative only, never text |

### Light from the trip

The next-trip card on Trips is lit by its weather (`tripLight` in `lib/trip-time.ts`): ice blue under 12°, the accent in between, sun over 28°. It is the only glow in the app and it carries information.

---

## Typography

System stack (`SamsungOne`, then platform sans). Page titles 28 to 30px semibold, tight tracking. Section titles `.section-title` (15px semibold `fog-100`, sentence case) with `.section-meta` (12px `fog-400`, tabular) for counts. **No uppercase tracked eyebrows**: they were on every section and restated what the screen already said.

Headlines carry state, not slogans: "Goa in 4 days.", "Day 2 in Goa.", "Nowhere booked."

---

## Components

### Segmented control (`.seg` / `.seg-item`)
To pack / Packed. Selected by `aria-selected`/`aria-checked`/`aria-pressed`, raised `ink-500`.

### Chip (`.chip`)
Vibes, sections, quick dates, vehicles, Gear filters. 44px. Same selected treatment as a segment.

### Field (`.field`)
48px input on `ink-300`, blue border on focus.

### Grouped list (`.group-list`)
One `ink-200` surface, rows split by `white/[0.06]` hairlines, the way Android's own settings lists work. Used for packing groups, trip lists, Gear, menus. Replaces a card per item.

### Packing row (`components/packing/PackingGroup.tsx`)
Two targets. The **56px tick column** toggles packed (blue circle; copper for critical). The **rest of the row** opens the item sheet. Ticking fast down a list never opens an item by accident, and editing never ticks one. Wardrobe clothes show a 44px photo on a `.photo-well`. Destination labels only on multi-stop trips.

In To pack, a ticked row slides out (`row-out`, 260ms) and a toast offers Undo.

### Item sheet (`components/packing/ItemSheet.tsx`)
Name, quantity stepper, note, Pack last switch, section, Save / Remove. Removing a suggestion hides it (`dismissed`) so a rebuild does not bring it back; removing a hand-added item deletes it.

### Photo plate (`.photo-well`)
Wardrobe photos are flattened onto black; the plate plus `mix-blend-mode: lighten` dissolves the black box.

### Bottom nav (`.nav-glass`)
Trips and Gear in a pill, label sliding open on the active tab, and a separate 60px blue + for New trip. Liquid glass on Chromium via `hooks/useLiquidGlass.ts` (canvas bevel map into `feDisplacementMap`, rebuilt on resize); frosted blur elsewhere.

---

## Screens

### Trips (`/`)
Date, a state headline, one line of status. The next active trip is the hero: name, places and nights, a countdown pill (copper within a day), weather chips, a 12px progress bar with "N to pack last", and one blue button whose label follows the state (Build the list / Start packing / Continue packing / Open the list). A trip is active until the day he gets back. Other upcoming trips and past trips are grouped lists; past ones carry **Again** (`/trips/new?from=`).

### New trip (`/trips/new`)
Where (stops with a nights stepper and one vibe), when (Tomorrow / This Saturday chips and a date), how (transport tiles; car shows the vehicle chips, flight shows Cabin bag only), work trip, then an optional name that defaults to "Goa, Oct". The button builds the list. `?from=` copies an old list unticked (as `source = user`).

### Trip (`/trips/[id]`)
Back and a ⋯ menu (Rebuild, Pack like this again, Delete). Title, places, a countdown and weather chips. A status card: progress and up to three "Notes from Go". Then To pack / Packed, and the groups in order: **Don't forget**, Clothing, Grooming, Electronics, Documents, Other, **Pack last**. On the day before and the day of departure, Pack last moves to the top. Every group ends in an inline "Add to …" row. An empty list builds itself on open.

### Gear (`/items`)
Grooming, electronics, documents, other: the things the engine packs besides clothes. A row at the top says clothes come from the Wardrobe (with its piece count). Filter chips, grouped lists, detail sheet. Adding gear has no Clothing option.

---

## The engine, as the UI depends on it

- **Clothes come from the Wardrobe** (`items` table, read-only): tops, going-out bottoms, lounge, footwear, belt, watch, sunglasses, chosen by temperature, formality and colour variety; favourites tagged `signature` first. Generic lines only when the Wardrobe cannot be read.
- **Don't forget** is the few things a trip fails without (ID or passport, wallet, tickets, medicines, situational swimwear and thermals). It used to hold 22 items.
- **Pack last** marks what is used until departure: grooming, phone charger, power bank, laptop.
- **Rebuild merges** (`/api/pack`): existing rows keep their ticks and notes, `user` rows are never touched, unpacked suggestions that no longer apply are removed, new ones are added.
- **Notes** (`/api/notes`) come after the list, from a model with timeouts, three plain lines at most.

---

## Motion

`--ease-spring` (`cubic-bezier(0.22, 1, 0.36, 1)`), 180 to 260ms, transform and opacity only (the progress fill is the one width transition). Page enter, sheet slide-up, row-out on tick, scale-in on the check and the all-packed mark.

**There is deliberately no `prefers-reduced-motion` override.** Gaurav runs reduce-motion on at the OS level; the blanket rule that used to be in `globals.css` froze the app.

---

*Last updated: September 2026, the revamp: OKLCH night-blue ink, Wardrobe clothes in the list, pack last, merge-on-rebuild, Trips/Gear, state headlines, liquid glass nav.*
