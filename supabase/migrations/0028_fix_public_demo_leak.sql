-- Fixes a real data leak: migration 0025 published a real user's live
-- research (matched by literal product-name string) to the public
-- unauthenticated search, with zero consent from the owner. Any real
-- seller who happened to name their research the same thing would have
-- had their private category, target price, supplier count, and decision
-- score exposed to anonymous visitors.
--
-- Fix: un-publish anything that isn't explicitly flagged as demo content,
-- add a real is_demo flag, and require BOTH is_demo AND is_public before
-- anything is eligible for the public search — defense in depth so a
-- future accidental `is_public = true` on real user data can never surface
-- publicly on its own.

ALTER TABLE product_ideas ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE product_ideas
SET is_public = FALSE, public_slug = NULL, published_at = NULL
WHERE is_public = TRUE AND is_demo = FALSE;

DROP INDEX IF EXISTS idx_product_ideas_public_discovery;
CREATE INDEX IF NOT EXISTS idx_product_ideas_public_discovery
  ON product_ideas (is_demo, is_public, published_at DESC)
  WHERE is_demo = TRUE AND is_public = TRUE;

COMMENT ON COLUMN product_ideas.is_demo IS 'Set true only for deliberately-seeded example content (see scripts/seed-public-demo-research.mjs). Real user research must never be published via this flag.';
