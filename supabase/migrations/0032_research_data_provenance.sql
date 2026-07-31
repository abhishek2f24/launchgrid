-- Data provenance for the research module.
--
-- Until now nothing in the schema distinguished a value that was SCRAPED from a real
-- supplier page, TYPED by the merchant, or SEEDED as demo filler. That made synthetic
-- demo rows indistinguishable from genuine evidence once they were in the table — the
-- root cause of research reports that looked authoritative while resting on invented
-- inputs. Every research row must now declare where it came from.

DO $$ BEGIN
  CREATE TYPE research_data_source AS ENUM ('scraped', 'manual', 'seeded', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── suppliers ────────────────────────────────────────────────────────────────
ALTER TABLE research_suppliers
  ADD COLUMN IF NOT EXISTS data_source research_data_source NOT NULL DEFAULT 'unknown',
  -- 0..1 from the adapter framework; low-confidence extractions are surfaced, not trusted.
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC,
  -- Which adapter + selector version produced this, so a bad scrape is traceable.
  ADD COLUMN IF NOT EXISTS parser_version TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;

COMMENT ON COLUMN research_suppliers.data_source IS
  'scraped = extracted from a real supplier page by an adapter; manual = typed by the merchant; seeded = demo fixture, never to be presented as evidence.';

-- ── price tiers ──────────────────────────────────────────────────────────────
ALTER TABLE research_price_tiers
  ADD COLUMN IF NOT EXISTS data_source research_data_source NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS parser_version TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;

-- ── ideas ────────────────────────────────────────────────────────────────────
-- Lets the report header state plainly whether the decision rests on real evidence.
ALTER TABLE product_ideas
  ADD COLUMN IF NOT EXISTS data_source research_data_source NOT NULL DEFAULT 'unknown';

CREATE INDEX IF NOT EXISTS idx_research_suppliers_data_source ON research_suppliers (data_source);
CREATE INDEX IF NOT EXISTS idx_product_ideas_data_source ON product_ideas (data_source);

-- ── backfill existing rows honestly ──────────────────────────────────────────
-- Anything created by the bulk demo seeder is 'seeded'; everything else pre-dating
-- provenance was hand-entered through the dashboard, so it is 'manual'.
UPDATE product_ideas SET data_source = 'seeded'
  WHERE is_demo = true AND data_source = 'unknown';

UPDATE research_suppliers s SET data_source = 'seeded'
  FROM product_ideas i
  WHERE i.id = s.product_idea_id AND i.is_demo = true AND s.data_source = 'unknown';

UPDATE research_price_tiers t SET data_source = 'seeded'
  FROM research_suppliers s JOIN product_ideas i ON i.id = s.product_idea_id
  WHERE s.id = t.supplier_id AND i.is_demo = true AND t.data_source = 'unknown';

UPDATE product_ideas SET data_source = 'manual' WHERE data_source = 'unknown';
UPDATE research_suppliers SET data_source = 'manual' WHERE data_source = 'unknown';
UPDATE research_price_tiers SET data_source = 'manual' WHERE data_source = 'unknown';
