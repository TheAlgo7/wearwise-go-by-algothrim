# WearWise Go

Intelligent packing lists for multi-destination trips. Built as a companion to the WearWise Wardrobe app.

## What it does

- Generate smart packing lists based on destination weather, trip duration, and travel situation
- Multi-stop itineraries with per-destination layer reasoning (e.g. heavy jacket flagged specifically for the cold leg)
- Critical "Don't forget" section for passport, medicines, chargers, and trip-specific essentials
- Urgency mode: when departure is 0–1 days away, a banner surfaces the most critical items first
- AI packing intelligence via a Groq → OpenRouter → Gemini fallback chain
- Transport-aware suggestions (carry-on liquids, road trip extras, train comfort items)
- Conditional laptop: added automatically for work trips or stays of 7+ nights
- PWA — installable on Android/iOS, works offline after first visit

## Tech stack

| Layer     | Choice                                                |
| --------- | ----------------------------------------------------- |
| Framework | Next.js 16 App Router, React 19                       |
| Language  | TypeScript                                            |
| Styling   | Tailwind CSS v3                                       |
| Database  | Supabase (Postgres)                                   |
| Auth      | Supabase anon key (single-user, no login)             |
| AI        | Groq (llama-3.3-70b) > OpenRouter > Gemini 2.0 Flash  |
| Weather   | OpenWeatherMap current conditions                     |
| PWA       | Custom service worker + Web App Manifest              |

## Design

Samsung OneUI-inspired AMOLED dark UI. Teal accent (`#18B7A6`). Ink scale with teal-tinted neutrals.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in keys below
npm run dev
```

### Required env vars

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENWEATHER_API_KEY=
GROQ_API_KEY=
OPENROUTER_API_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_DEFAULT_CITY=New Delhi,IN
```

### Database setup

Run `supabase/schema.sql` in the Supabase SQL editor, then `supabase/seed.sql` for default items and packing rules. If upgrading from a previous version, also run `supabase/migration-001-sprint2.sql`.

## How packing generation works

1. User creates a trip with destinations, nights, situation tags (beach / mountain / business / resort / cold / city), and transport mode
2. App fetches current weather for each destination city via OpenWeather
3. Deterministic packing engine (`src/lib/packing-engine.ts`) builds the list from trip context and weather
4. AI (Groq/OpenRouter/Gemini) reviews the list and adds a short intelligence note
5. List is persisted to Supabase so it survives page refreshes and can be checked off

## Project structure

```text
src/
  app/
    api/pack/        AI + engine orchestration
    api/weather/     Multi-city weather fetch
    trips/new/       New trip form
    trips/[id]/      Trip detail + packing list
  components/
    CriticalSection  Amber "Don't forget" section
    PackingSection   Collapsible category section
    TripCard         Home screen trip card
    DestinationInput Multi-stop city/nights/situation input
    oneui/           Design system components
  lib/
    packing-engine   Deterministic list builder
    prompts          AI prompt builder
    llm              Groq → OpenRouter → Gemini chain
    weather          OpenWeather fetch
    supabase/        Client, server, and type helpers
  types/             Shared TypeScript types
supabase/
  schema.sql         Full DB schema
  seed.sql           Default items and rules
  migration-001-sprint2.sql   Priority + is_work columns
```

## Scripts

```bash
npm run dev          # local dev server
npm run build        # production build
npm run type-check   # TypeScript check without emit
```

## Deployment

Deployed on Vercel. Push to `main` triggers auto-deploy. Environment variables are set in the Vercel dashboard (not committed).
