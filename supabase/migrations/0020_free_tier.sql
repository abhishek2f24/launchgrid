-- 0020_free_tier.sql
-- Adds a genuinely free entry tier below the paid plans.
-- Model: Free Starter (₹0, 3-product cap, "Made with LaunchGrid" badge)
--        → Get Online ₹1999 → Get Customers ₹9999 → Scale Revenue ₹24999
--
-- NOTE: ALTER TYPE ... ADD VALUE cannot run inside a transaction block in
-- older Postgres. Run this file on its own (Supabase SQL editor runs each
-- statement fine). Adding a value is safe and irreversible (no DROP needed).

-- 1. Add 'free' as the lowest tier in the enum, ordered before 'starter'.
ALTER TYPE plan_tier_enum ADD VALUE IF NOT EXISTS 'free' BEFORE 'starter';

-- 2. New stores should default to the free tier at the DB level too, so a
--    store with no explicit subscription row is unambiguously free.
--    (App code already falls back to 'free' via getPlan(); this keeps the
--    database in agreement.)
ALTER TABLE subscriptions ALTER COLUMN plan_tier SET DEFAULT 'free';
