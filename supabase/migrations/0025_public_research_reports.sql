-- Public discovery is opt-in. User-owned research remains private unless an
-- operator explicitly publishes a report and provides the searchable intent
-- terms that were actually reviewed for that report.

ALTER TABLE product_ideas
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS public_slug TEXT,
  ADD COLUMN IF NOT EXISTS public_intent_keywords TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_ideas_public_slug
  ON product_ideas (public_slug)
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_ideas_public_discovery
  ON product_ideas (is_public, published_at DESC);

-- Initial catalogue report. The terms are intentional search aliases for this
-- product category, not synthetic market or demographic data.
UPDATE product_ideas
SET
  is_public = TRUE,
  public_slug = 'mesh-laundry-bag-set-of-3',
  public_intent_keywords = ARRAY[
    'mesh laundry bag',
    'laundry bag',
    'wash bag',
    'delicates bag',
    'garment wash bag'
  ],
  published_at = COALESCE(published_at, NOW())
WHERE name = 'Mesh Laundry Bag (Set of 3)';
