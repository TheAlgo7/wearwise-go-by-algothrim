# Design System — WearWise Go

## Theme

Dark. Forced — not a preference. The physical scene is an airport check-in, a train platform, a hotel room at midnight. The surface is deep near-black with cold blue undertones; the accent cuts through clearly without glaring in low ambient light.

Color strategy: **Restrained**. Cold blue-tinted neutrals dominate. The cornflower blue accent carries all active, primary, and interactive states — never scattered decoratively. Amber is reserved exclusively for urgency and the "Don't forget" critical section.

---

## Color Palette

### Background (ink scale)

| Token | Hex | Role |
|---|---|---|
| `ink-0` | `#000000` | Base canvas, AMOLED background |
| `ink-50` | `#080A0F` | Page-level background |
| `ink-100` | `#10131A` | Primary app background |
| `ink-200` | `#171A22` | Card and surface background |
| `ink-300` | `#1E232D` | Elevated surface, inputs |
| `ink-400` | `#252B37` | Input background, chip background |
| `ink-500` | `#303848` | Dividers, subtle borders |
| `ink-600` | `#3D4659` | Strong borders |

The ink scale is cold-tinted (blue-shifted) to harmonise with the blue accent. This is intentional and distinct from the WearWise Wardrobe warm/mauve ink scale.

### Text (fog scale)

| Token | Hex | Role |
|---|---|---|
| `fog-100` | `#F3F6FF` | Primary body text |
| `fog-200` | `#DDE7FA` | Secondary text, inactive labels |
| `fog-300` | `#BAC8E2` | Placeholder text, tertiary |
| `fog-400` | `#91A0BA` | Disabled, ghost |
| `fog-500` | `#6F7D97` | Subtle text |
| `fog-600` | `#535F76` | Captions, timestamps |
| `fog-700` | `#3E485B` | Very subtle, borders |

### Accent (blue scale)

| Token | Hex | Role |
|---|---|---|
| `blue-100` | `#DDE2FF` | High-emphasis text on dark |
| `blue-300` | `#96B8F7` | Icons on dark backgrounds, captions, secondary text |
| `blue-400` | `#6B9FED` | Primary CTA, active states, generate button, focus rings |
| `blue-500` | `#4B80D9` | Hover state for blue-400 |
| `blue-600` | `#3060B8` | Pressed state |

### Urgency / Critical (copper)

Soft copper (`#C8855A`) is used exclusively for the "Don't forget" critical section and the urgency banner (departure within 1 day). The Tailwind `amber` scale is overridden in `tailwind.config.ts` to output these copper values — class names remain `amber-*` but render copper. Never use for decorative or non-urgent purposes.

| Usage | Class | Actual colour |
| --- | --- | --- |
| Critical section background | `bg-amber-500/[0.08]` | `#A86840` at 8% |
| Critical section border | `border-amber-500/25` | `#A86840` at 25% |
| Critical icon + heading | `text-amber-400` | `#C8855A` |
| Urgency banner | `bg-amber-500/10 border-amber-500/30 text-amber-400` | copper tints |
| Days countdown (≤3 days) | `text-amber-400` | `#C8855A` |

### Semantic

| Usage | Class |
|---|---|
| Error background | `bg-red-400/10` |
| Error text | `text-red-400` |

---

## Typography

Font stack: `SamsungOne`, `SamsungSharpSans`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.

No custom type scale tokens in tailwind.config (unlike Wardrobe app). Sizes are set inline per component. Common patterns:

| Usage | Class |
|---|---|
| Page hero title | `text-[30px] font-semibold leading-[1.2]` |
| Section label / eyebrow | `text-[12px] font-semibold tracking-widest uppercase` |
| Card heading | `text-[16px] font-semibold` |
| Body text | `text-sm` (14px) |
| Caption / metadata | `text-xs` (12px) |
| Tiny label | `text-[10px]` / `text-[11px]` |

Hierarchy: scale + weight contrast. Eyebrows use `text-blue-300`. Primary text uses `fog-100`. Supporting text uses `fog-400` to `fog-600`.

---

## Elevation and Surfaces

Two surface levels. Never nest — a raised card inside a raised card is always wrong.

| Level | Visual treatment |
|---|---|
| Page | `ink-50` / `ink-0` background, no border |
| Card / surface | `bg-ink-200 border border-white/[0.06] rounded-[1.65rem] shadow-card` |

`shadow-card`: `0 1px 0 rgba(255,255,255,0.04) inset` — inner top highlight giving perceived lift without a drop shadow.

Cards in trip detail (PackingSection, CriticalSection): `rounded-[1.65rem]`.
Trip cards on home: `rounded-[1.65rem]`.
Inputs and chips: `bg-ink-300 rounded-oneui-sm` (14px).

---

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-oneui-sm` | 14px | Inputs, small chips |
| `rounded-oneui` | 20px | Standard cards, buttons |
| `rounded-oneui-lg` | 26px | Large cards, packing sections |
| `rounded-oneui-xl` | 32px | Extra-large panels |
| `rounded-full` | 50% | Pill buttons, icon buttons, nav, avatar |

---

## Components

### OneUIButton

Pill-shaped (`rounded-oneui` or `rounded-oneui-lg` by size). Four variants:

- `primary`: `bg-blue-400`, white text. The main action.
- `secondary`: `bg-ink-200`, `text-fog-100`. Secondary actions.
- `ghost`: transparent, `text-blue-300`. Tertiary links.
- `danger`: `bg-red-600/20`, `text-red-400`. Destructive.

Sizes: sm (h-9 / 36px — avoid on mobile), md (h-11), lg (h-14).

Focus ring: `focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-0`.

Loading state: spinner + disabled. Uses `aria-busy`.

### OneUIToggle

`role="switch"` + `aria-checked`. Width 48px (`w-12`), height 28px (`h-7`). Active: `bg-blue-400`. Inactive: `bg-ink-400`. Knob: white circle, `translate-x-1` → `translate-x-6`.

**Known gap**: Touch target height is 28px. Wrap in a row with min-height 44px at the parent level.

### OneUIChip

Situation chips in DestinationInput: `px-2.5 py-1 rounded-full text-xs`. Active: `bg-blue-400 text-white`. Inactive: `bg-ink-300 text-fog-500`.

### PackingSection

Collapsible section with accordion. Header: icon circle + category label + packed count + chevron. Body: list of check-off items. Check circle: 20px, teal on packed.

### CriticalSection

Always open. Amber-tinted header with `AlertTriangle` icon. Shown at top of packing list before all category sections. Items have amber check circles.

### OneUIHeader

Sticky. `bg-ink-0/[0.88] backdrop-blur-md border-b border-white/[0.06]`. Contains title + optional subtitle + left/right slots (back arrow, delete button).

### BottomNav

Fixed floating pill at bottom. `bg-ink-200 border-white/[0.07] rounded-full`. 2 tabs: Trips, Items. Active: `text-blue-50` + `bg-blue-400/30` pill highlight with `animate-scale-in`. Inactive: `text-white/40`.

---

## Motion

| Variable | Value | Usage |
|---|---|---|
| Fast | 150ms | Button state changes |
| Base | 200–240ms | Page entries, sheet slides |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` | All easing — exponential out |

Never ease-in. No bounce, no elastic. All animations use `transform` and `opacity` only — never animate `width`, `height`, or layout properties.

Progress bar exception: animates `width` — use `transition-[width]` (not `transition-all`).

Named animations in tailwind.config: `slide-up`, `slide-down`, `fade-in`, `scale-in`, `shimmer`.

---

## Layout

### Max width
`max-w-xl` (576px) centred. Single-column mobile-first layout.

### Spacing rhythm

| Context | Value |
|---|---|
| Between cards | `gap-3` (12px) |
| Internal card padding | `p-4` |
| Page horizontal | `px-4` (16px) |
| Page top padding | `pt-4` to `pt-14` depending on hero |
| Section gaps | `space-y-4` |

### Safe areas

Bottom nav uses `calc(env(safe-area-inset-bottom) + 16px)` for padding.
Main content uses `pb-nav` = `calc(env(safe-area-inset-bottom) + 4rem)`.
Header uses `pt-safe` for status bar clearance.

---

## Accessibility

- All interactive elements: `focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2`.
- Form inputs: `aria-label` on all unlabelled inputs.
- Toggle buttons: `role="switch"` + `aria-checked`.
- Packing checkboxes: `role` implicit button + `aria-pressed`.
- Nav: `aria-label="Main navigation"` + `aria-current="page"` on active tab.
- Error messages: `role="alert"`.
- Progress bars: `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`.
- Sections: `aria-labelledby` pointing to their heading id.
- Touch targets: 44px minimum on all interactive elements. Toggle row must provide 44px height at parent level.

---

## Packing List Visual Hierarchy

1. **CriticalSection** (amber) — always first, always open
2. **Clothing** — collapsible
3. **Grooming** — collapsible
4. **Electronics** — collapsible
5. **Documents** — collapsible
6. **Misc** — collapsible

Items with `destination_label` show a small tinted uppercase tag below the name (teal for normal items, amber for critical items).

---

*Last updated: May 2026*
