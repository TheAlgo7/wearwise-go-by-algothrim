-- WearWise Go — Supabase schema (CANONICAL — run this for a fresh install)
-- Run in Supabase SQL editor, then seed.sql. See supabase/README.md.
-- The migration-*.sql files are historical and not needed for new projects.

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Travel items (packing-eligible wardrobe items) ──────────────────────────
create table if not exists travel_items (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  category    text not null check (category in ('clothing','grooming','electronics','documents','misc')),
  layer       text check (layer in ('base','mid','outer','bottom','footwear','accessory')),
  warmth      smallint check (warmth between 1 and 5),
  formality   smallint check (formality between 1 and 5),
  color       text,
  tags        text[] not null default '{}',
  is_clothing boolean not null default false,
  size_ml     smallint,                        -- liquid volume; null for solids/non-liquids
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ─── Packing rules ───────────────────────────────────────────────────────────
create table if not exists packing_rules (
  id        uuid primary key default uuid_generate_v4(),
  situation text not null,   -- e.g. 'beach', 'mountain', 'business'
  item_name text not null,
  quantity  smallint not null default 1,
  notes     text
);

-- ─── Trips ───────────────────────────────────────────────────────────────────
create table if not exists trips (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  departure     date not null,
  transport     text not null check (transport in ('plane','car','train','bus')),
  vehicle_profile text check (
    vehicle_profile is null or vehicle_profile in (
      'curvv',
      'virtus_gt',
      'thar_roxx',
      'fortuner_legender',
      'alto_k10',
      'venue',
      'friends_car'
    )
  ),
  destinations  jsonb not null default '[]',
  carry_on_only boolean not null default false,
  is_work       boolean not null default false,
  weather       jsonb,             -- last generated weather snapshot (DestinationWeather[])
  packing_reasoning text,          -- last AI review of the generated kit
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Packing list items ──────────────────────────────────────────────────────
create table if not exists packing_lists (
  id                uuid primary key default uuid_generate_v4(),
  trip_id           uuid not null references trips(id) on delete cascade,
  category          text not null check (category in ('clothing','grooming','electronics','documents','misc')),
  name              text not null,
  quantity          smallint not null default 1,
  packed            boolean not null default false,
  is_clothing       boolean not null default false,
  priority          text not null default 'normal' check (priority in ('critical','normal')),
  destination_label text,
  notes             text,
  created_at        timestamptz not null default now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
create index if not exists idx_packing_lists_trip_id   on packing_lists(trip_id);
create index if not exists idx_packing_lists_priority  on packing_lists(priority);
create index if not exists idx_trips_departure         on trips(departure desc);
create index if not exists idx_packing_rules_situation on packing_rules(situation);

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trips_updated_at on trips;
create trigger trips_updated_at
  before update on trips
  for each row execute function set_updated_at();
