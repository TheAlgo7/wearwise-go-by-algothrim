alter table public.trips
  add column if not exists vehicle_profile text;

alter table public.trips
  drop constraint if exists trips_vehicle_profile_check;

alter table public.trips
  add constraint trips_vehicle_profile_check
  check (
    vehicle_profile is null or vehicle_profile in (
      'curvv',
      'virtus_gt',
      'thar_roxx',
      'fortuner_legender',
      'alto_k10',
      'venue',
      'friends_car'
    )
  );
