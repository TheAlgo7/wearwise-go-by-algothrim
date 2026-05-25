-- WearWise Go — seed data
-- Run AFTER schema.sql

-- ─── Default grooming items ──────────────────────────────────────────────────
insert into travel_items (name, category, is_clothing, tags) values
  ('Toothbrush',      'grooming', false, '{hygiene}'),
  ('Toothpaste',      'grooming', false, '{hygiene}'),
  ('Deodorant',       'grooming', false, '{hygiene}'),
  ('Shampoo',         'grooming', false, '{hygiene,liquid}'),
  ('Body wash',       'grooming', false, '{hygiene,liquid}'),
  ('Moisturiser',     'grooming', false, '{skincare,liquid}'),
  ('Sunscreen SPF50', 'grooming', false, '{skincare,liquid}'),
  ('Face wash',       'grooming', false, '{skincare,liquid}'),
  ('Razor',           'grooming', false, '{hygiene}'),
  ('Nail clippers',   'grooming', false, '{hygiene}'),
  ('Hair comb',       'grooming', false, '{hygiene}'),
  ('Lip balm',        'grooming', false, '{skincare}')
on conflict do nothing;

-- ─── Default electronics ─────────────────────────────────────────────────────
insert into travel_items (name, category, is_clothing, tags) values
  ('Phone charger',       'electronics', false, '{tech,cables}'),
  ('Power bank',          'electronics', false, '{tech,power}'),
  ('Earphones',           'electronics', false, '{tech,audio}'),
  ('Universal adapter',   'electronics', false, '{tech,power}'),
  ('Laptop',              'electronics', false, '{tech,work}'),
  ('Laptop charger',      'electronics', false, '{tech,cables,work}'),
  ('Camera',              'electronics', false, '{tech,photography}'),
  ('Camera charger',      'electronics', false, '{tech,cables,photography}')
on conflict do nothing;

-- ─── Default documents ───────────────────────────────────────────────────────
insert into travel_items (name, category, is_clothing, tags) values
  ('Passport',            'documents', false, '{identity,required}'),
  ('Visa / e-Visa',       'documents', false, '{identity}'),
  ('Travel insurance',    'documents', false, '{insurance}'),
  ('Booking confirmations','documents',false, '{bookings}'),
  ('Emergency contacts',  'documents', false, '{safety}')
on conflict do nothing;

-- ─── Situational packing rules ───────────────────────────────────────────────
insert into packing_rules (situation, item_name, quantity, notes) values
  -- beach / resort
  ('beach',    'Swimwear',          2, 'Pack 2 — one to wear, one to dry'),
  ('beach',    'Beach towel',       1, null),
  ('beach',    'Flip-flops',        1, null),
  ('beach',    'Sunscreen SPF50',   1, 'Likely already in grooming — verify'),
  ('resort',   'Swimwear',          2, null),
  ('resort',   'Beach towel',       1, 'Resort may provide — check'),
  ('resort',   'Flip-flops',        1, null),
  -- mountain / trekking
  ('mountain', 'Thermal base layer',2, 'Top and bottom'),
  ('mountain', 'Fleece mid layer',  1, null),
  ('mountain', 'Waterproof jacket', 1, null),
  ('mountain', 'Hiking socks',      3, null),
  ('mountain', 'Trekking boots',    1, null),
  ('mountain', 'Lip balm',          1, 'Altitude dries lips quickly'),
  ('mountain', 'Sunglasses',        1, 'UV reflection is intense'),
  -- business / formal
  ('business', 'Formal shirt',      2, null),
  ('business', 'Formal trousers',   1, null),
  ('business', 'Blazer',            1, null),
  ('business', 'Formal shoes',      1, null),
  ('business', 'Belt',              1, null),
  -- cold weather
  ('cold',     'Thermal base layer',2, null),
  ('cold',     'Heavy jacket',      1, null),
  ('cold',     'Woollen socks',     3, null),
  ('cold',     'Gloves',            1, null),
  ('cold',     'Beanie / hat',      1, null),
  ('cold',     'Scarf',             1, null)
on conflict do nothing;
