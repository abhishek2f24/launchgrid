-- Migration 0014: Trial Engine, Visitor Tracking, and Discover Feed

-- 1. Fix the missing 'trialing' and 'archived' statuses on subscription_status_enum
-- PostgreSQL allows adding values to enums, but it cannot run in a transaction block.
-- We will handle this in pg client. But SQL statements themselves:
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'trialing';
ALTER TYPE subscription_status_enum ADD VALUE IF NOT EXISTS 'archived';

-- 2. Add trial columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_email_18h_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_email_23h_sent BOOLEAN DEFAULT FALSE;

-- 3. Add featured_until column to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- 4. Add step_5_shared column to tenant_missions table
ALTER TABLE tenant_missions ADD COLUMN IF NOT EXISTS step_5_shared BOOLEAN DEFAULT FALSE;

-- 5. Create store_events tracking schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_event_type_enum') THEN
    CREATE TYPE store_event_type_enum AS ENUM ('page_view', 'product_view', 'cart_add', 'checkout_start');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS store_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type store_event_type_enum NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS store_events_store_id_idx ON store_events(store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS store_events_store_type_idx ON store_events(store_id, event_type);

-- RLS enablement
ALTER TABLE store_events ENABLE ROW LEVEL SECURITY;

-- Select policy: Store owners can read their events
DROP POLICY IF EXISTS "Store owners can read their events" ON store_events;
CREATE POLICY "Store owners can read their events" ON store_events
  FOR SELECT USING (
    store_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Insert policy: public can insert events via service role, or we allow INSERT for anyone (to simplify API tracking)
DROP POLICY IF EXISTS "Anyone can insert events" ON store_events;
CREATE POLICY "Anyone can insert events" ON store_events
  FOR INSERT WITH CHECK (true);
