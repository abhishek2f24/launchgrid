-- Supplier contact details — the difference between a report you can read and a
-- report you can act on.
--
-- WHY
--   Measured across the 145 real scraped suppliers: 0% had a phone, an email, a
--   profile URL, an MOQ or any certification. A merchant paying for research
--   received three company names and a price, with no way to contact anyone — so
--   they had to go and search the supplier directory themselves, which is the exact
--   work the report was supposed to replace.
--
--   These fields come from the supplier's PROFILE page, not the search card. The
--   card never carried them, which is why the columns were never needed before.
--
-- NULLABLE ON PURPOSE
--   Every column here is nullable with no default. A supplier page that does not
--   publish a phone number must leave `contact_phone` NULL ("unknown"), never an
--   empty string ("we checked, there is none"). This is the same NULL-vs-false
--   distinction the 13 evidence booleans rely on — see migration 0023 and the
--   ingest endpoint.

ALTER TABLE research_suppliers
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  -- Names as printed on the profile (e.g. 'ISO 9001', 'GST registered'). Storing the
  -- raw strings rather than mapping them onto the evidence booleans is deliberate:
  -- a self-declared badge is a claim by the seller, not verification by us.
  ADD COLUMN IF NOT EXISTS certifications TEXT[],
  -- Set when the profile page was successfully parsed, so a report can distinguish
  -- "we never looked" from "we looked and the page published nothing".
  ADD COLUMN IF NOT EXISTS detail_scraped_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_research_suppliers_detail_scraped
  ON research_suppliers (product_idea_id) WHERE detail_scraped_at IS NOT NULL;
