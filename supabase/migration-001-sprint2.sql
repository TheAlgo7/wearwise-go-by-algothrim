-- WearWise Go — Sprint 2 migration
-- Run in Supabase SQL editor AFTER schema.sql

-- Priority and destination label on packing list items
ALTER TABLE packing_lists
  ADD COLUMN IF NOT EXISTS priority         text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('critical', 'normal')),
  ADD COLUMN IF NOT EXISTS destination_label text;

-- Work trip flag on trips
ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS is_work boolean NOT NULL DEFAULT false;

-- Index for fast priority queries
CREATE INDEX IF NOT EXISTS idx_packing_lists_priority ON packing_lists(priority);
