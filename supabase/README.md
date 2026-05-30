# WearWise Go — Database

## Fresh install (this is all you need)

Run these two files in the Supabase SQL editor, in order:

1. **`schema.sql`** — the complete, canonical schema. Tables, constraints,
   indexes, and triggers. Always current.
2. **`seed.sql`** — default travel items and situational packing rules.
   Safe to re-run.

That's it. You do **not** need the `migration-*.sql` files for a new project.

## What are the `migration-*.sql` files then?

They are **historical** incremental changes, kept only so an *already-deployed*
database (created before a column existed) can be upgraded in place:

| File | Adds | Status |
| --- | --- | --- |
| `migration-001-sprint2.sql` | `packing_lists.priority`, `packing_lists.destination_label`, `trips.is_work` | Folded into `schema.sql` |
| `migration-002-vehicle-profile.sql` | `trips.vehicle_profile` (+ check constraint) | Folded into `schema.sql` |

Every column these add is already present in `schema.sql`. If you are setting up
from scratch, ignore them.
