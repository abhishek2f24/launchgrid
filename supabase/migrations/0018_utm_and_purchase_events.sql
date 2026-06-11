-- Migration 0018: UTM attribution columns + purchase funnel event
-- 1. Add 'purchase' to the store event enum (completes the funnel:
--    page_view → product_view → cart_add → checkout_start → purchase)
ALTER TYPE store_event_type_enum ADD VALUE IF NOT EXISTS 'purchase';

-- 2. UTM attribution columns (first-touch, captured client-side per session)
ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 3. Index for campaign-performance queries (merchant insights)
CREATE INDEX IF NOT EXISTS store_events_utm_source_idx
  ON store_events(store_id, utm_source)
  WHERE utm_source IS NOT NULL;
