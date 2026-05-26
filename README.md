<div align="center">

# WearWise Go

### *Pack like you already remembered everything.*

[![Next.js](https://img.shields.io/badge/Next.js-16-6B9FED?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=111111)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-6B9FED?style=flat-square&logo=typescript&logoColor=white&labelColor=111111)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-6B9FED?style=flat-square&logo=supabase&logoColor=white&labelColor=111111)](https://supabase.com)
[![PWA](https://img.shields.io/badge/PWA-Installable-6B9FED?style=flat-square&labelColor=111111)](https://github.com/TheAlgo7/wearwise-go-by-algothrim)
[![AI](https://img.shields.io/badge/AI-Gemini%20·%20Groq%20·%20OpenRouter-6B9FED?style=flat-square&labelColor=111111)](https://github.com/TheAlgo7/wearwise-go-by-algothrim)

</div>

## Why This Exists

Every time you pack for a trip you start from zero. You check the same mental list, forget the same things, over-pack the same way, and arrive somewhere realising the one item you needed most is sitting on your bathroom shelf.

WearWise Go is built to end that. It knows the trip — where you're going, how you're getting there, how many nights, whether it's work or leisure, whether you're carry-on only. It generates a packing list from that context, tuned by AI to the specific conditions of that trip. Weather is fetched automatically. Liquids limits are enforced if you're flying carry-on. Formal wear is added if you marked it a work trip.

**This is a companion app to [WearWise Wardrobe](https://github.com/TheAlgo7/wearwise-by-algothrim).** Same design language, same stack, same owner. One tells you what to wear. This one tells you what to bring.

## How The Engine Works

**Stage 1 — The Trip**
User creates a trip with destinations, nights, vibe tags, and transport mode. Carry-on only and work trip flags adjust the generation rules before anything runs.

**Stage 2 — The Context**
Live weather is fetched for each destination at generation time and injected into the prompt — so suggestions are accurate to actual conditions, not generalised seasonal advice.

**Stage 3 — The List**
A deterministic packing engine builds the base list from trip context. AI (Groq → OpenRouter → Gemini fallback) then reviews it, tunes it, and surfaces the most critical items first.

The LLM is the last mile, not the whole pipeline. Filtering and context assembly happen in code so the model gets a tight, relevant brief instead of a raw dump of rules.

## Features

- **Context-aware packing lists** generated from trip details, not generic templates.
- **Multi-destination support** — multiple stops with individual night counts and vibes.
- **Weather-aware generation** — live conditions fetched at list creation time.
- **Carry-on mode** — enforces 100ml liquids rule and tight space constraints.
- **Work trip mode** — adds laptop, cables, and business documents automatically.
- **Pack progress tracking** — check items off as you go, persisted per trip.
- **Critical item surfacing** — passport-level items always appear first.
- **Urgency banner** — when departure is 0–1 days away, the most critical items surface at the top.
- **Offline-ready PWA** — installs to home screen, works without a connection after first load.

## Install to Home Screen

**Android (Chrome):**
1. Open the app in Chrome
2. Tap the **⋮** menu → **Add to Home screen**
3. Tap **Add** — WearWise Go installs like a native app

**iOS (Safari):**
1. Open the app in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add** — the app appears on your home screen

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router + React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS — Samsung One UI-inspired direction |
| Data | Supabase Postgres |
| AI | Gemini, Groq, OpenRouter |
| Weather | OpenWeather API |
| Hosting | Vercel |
| PWA | Custom service worker, Web App Manifest |

## Design Language

- **AMOLED-first.** Pure blacks, cornflower blue accents, soft copper for urgency states.
- **Samsung-inspired UI.** Rounded, touch-forward, comfortable at arm's length on a phone screen.
- **Shared system with WearWise Wardrobe.** Same tokens, same components, same typographic scale — one cohesive product family.
- **Built for the moment of packing.** Every screen is optimised for one task: getting out the door without forgetting anything.

## Security Note

Supabase RLS is intentionally open for V1 — this is a single-user personal tool with no public auth. If you fork this for your own use, tighten row-level security before exposing it to other users or storing sensitive data.

<details>
<summary>Quick Start</summary>

```bash
git clone https://github.com/TheAlgo7/wearwise-go-by-algothrim
cd wearwise-go-by-algothrim
npm install
npm run dev
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENWEATHER_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
NEXT_PUBLIC_DEFAULT_CITY=New Delhi,IN
```

Initialize the database:

```bash
# Run in Supabase SQL editor
supabase/schema.sql
supabase/seed.sql
```

```bash
npm run build
npm run start
npm run lint
npm run type-check
```

</details>

<div align="center">

Built for **real trips, real context, and nothing left behind** by **[The Algothrim](https://thealgothrim.com)**

</div>
