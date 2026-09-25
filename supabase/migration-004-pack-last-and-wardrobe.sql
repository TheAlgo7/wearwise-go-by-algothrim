-- WearWise Go: pack-last, hand-added items, and Wardrobe clothes on the list.
-- Applied to the shared project 2026-09-25 (Supabase migration
-- `go_packing_list_pack_last_source_image`). Already folded into schema.sql;
-- kept only to upgrade a pre-existing database.
--
-- Additive columns only, safe for the shared WearWise database.

alter table public.packing_lists
  add column if not exists pack_last boolean not null default false,
  add column if not exists source text not null default 'engine',
  add column if not exists image_url text,
  add column if not exists wardrobe_item_id uuid references public.items(id) on delete set null;

do $$ begin
  alter table public.packing_lists
    add constraint packing_lists_source_check check (source in ('engine','user'));
exception when duplicate_object then null; end $$;

-- A suggestion he removed stays removed: the row is kept, hidden, so a rebuild
-- sees the name and does not add it back. (Supabase migration
-- `go_packing_list_dismissed`, same day.)
alter table public.packing_lists
  add column if not exists dismissed boolean not null default false;
