CREATE TABLE IF NOT EXISTS research_marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_idea_id uuid NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  source_name text NOT NULL CHECK (source_name IN ('amazon_in','flipkart')),
  title text NOT NULL,
  source_url text NOT NULL,
  price numeric,
  currency text NOT NULL DEFAULT 'INR',
  rating numeric,
  review_count integer,
  data_source text NOT NULL DEFAULT 'scraped',
  extraction_confidence numeric,
  parser_version text,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_idea_id, source_name, source_url)
);
CREATE INDEX IF NOT EXISTS research_marketplace_listings_idea_idx ON research_marketplace_listings(product_idea_id, source_name);
ALTER TABLE research_marketplace_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketplace_listings_owner_read" ON research_marketplace_listings;
CREATE POLICY "marketplace_listings_owner_read" ON research_marketplace_listings FOR SELECT USING (EXISTS (SELECT 1 FROM product_ideas pi JOIN research_projects rp ON rp.id = pi.research_project_id WHERE pi.id = research_marketplace_listings.product_idea_id AND rp.user_id = auth.uid()));
DROP POLICY IF EXISTS "marketplace_listings_owner_write" ON research_marketplace_listings;
CREATE POLICY "marketplace_listings_owner_write" ON research_marketplace_listings FOR ALL USING (EXISTS (SELECT 1 FROM product_ideas pi JOIN research_projects rp ON rp.id = pi.research_project_id WHERE pi.id = research_marketplace_listings.product_idea_id AND rp.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM product_ideas pi JOIN research_projects rp ON rp.id = pi.research_project_id WHERE pi.id = research_marketplace_listings.product_idea_id AND rp.user_id = auth.uid()));
