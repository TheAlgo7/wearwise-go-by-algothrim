-- WearWise Go — weather + reasoning persistence  (HISTORICAL — see supabase/README.md)
--
-- Already included in schema.sql. Kept only to upgrade a pre-existing database.
-- Fresh installs: run schema.sql, NOT this file.
--
-- Additive nullable columns only — safe for the shared WearWise database.

alter table public.trips
  add column if not exists weather jsonb;

alter table public.trips
  add column if not exists packing_reasoning text;
