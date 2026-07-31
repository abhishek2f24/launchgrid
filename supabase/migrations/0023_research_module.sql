-- Migration 0023: Research Module
-- Adds the "research a product before you build a store" surface ported
-- from the standalone SourceIQ prototype. Scoped by user_id (not tenant_id)
-- because research happens before a subdomain/tenant necessarily exists —
-- a user can research many product ideas before ever committing to build a
-- store. product_ideas gets an optional tenant_id + product_id, populated
-- only once "Build my store" promotes an idea into a real product.

CREATE TABLE IF NOT EXISTS research_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_project_id UUID NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  target_retail_price NUMERIC(10,2),
  max_preferred_moq INTEGER,
  status TEXT NOT NULL DEFAULT 'researching', -- researching | launch_ready | promoted | archived
  -- Set only when this idea is promoted into a real storefront product —
  -- the bridge that makes "research -> build" a single click instead of a
  -- re-typed form.
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  promoted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_idea_id UUID NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  platform TEXT,
  country TEXT,
  city TEXT,
  currency TEXT DEFAULT 'USD',
  moq INTEGER,
  lead_time_days INTEGER,
  store_url TEXT,
  year_established INTEGER,
  customisation_capability BOOLEAN DEFAULT FALSE,
  audit_report_available BOOLEAN DEFAULT FALSE,
  business_licence_available BOOLEAN DEFAULT FALSE,
  factory_address_disclosed BOOLEAN DEFAULT FALSE,
  factory_video_available BOOLEAN DEFAULT FALSE,
  export_history BOOLEAN DEFAULT FALSE,
  broad_unrelated_catalogue BOOLEAN DEFAULT FALSE,
  identical_photos_flag BOOLEAN DEFAULT FALSE,
  refuses_audit_or_video BOOLEAN DEFAULT FALSE,
  cannot_explain_specs BOOLEAN DEFAULT FALSE,
  trading_only_scope BOOLEAN DEFAULT FALSE,
  unrealistically_low_price BOOLEAN DEFAULT FALSE,
  conflicting_company_names BOOLEAN DEFAULT FALSE,
  review_rating NUMERIC(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_price_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES research_suppliers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  incoterm TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_supplier_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES research_suppliers(id) ON DELETE CASCADE,
  manufacturer_confidence_score INTEGER NOT NULL,
  manufacturer_confidence_label TEXT NOT NULL,
  quality_score NUMERIC(5,2),
  quality_label TEXT,
  breakdown_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_landed_cost_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_idea_id UUID NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES research_suppliers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  inputs_json JSONB NOT NULL,
  outputs_json JSONB NOT NULL,
  confidence TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_profitability_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_idea_id UUID NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  landed_cost_scenario_id UUID REFERENCES research_landed_cost_scenarios(id) ON DELETE SET NULL,
  scenario_type TEXT NOT NULL, -- conservative | expected | optimistic
  inputs_json JSONB NOT NULL,
  outputs_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS research_opportunity_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_idea_id UUID NOT NULL REFERENCES product_ideas(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES research_suppliers(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL,
  recommendation TEXT NOT NULL,
  breakdown_json JSONB NOT NULL,
  score_version TEXT NOT NULL DEFAULT '1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage metering for the per-plan monthly research quota (see plans.ts
-- research_ideas_per_month). One row per calendar month per user; the
-- server action increments this atomically before creating a product_idea.
CREATE TABLE IF NOT EXISTS research_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_month DATE NOT NULL, -- first day of the month, e.g. 2026-07-01
  ideas_created INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_product_ideas_user ON product_ideas(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_ideas_project ON product_ideas(research_project_id);
CREATE INDEX IF NOT EXISTS idx_research_suppliers_idea ON research_suppliers(product_idea_id);
CREATE INDEX IF NOT EXISTS idx_research_price_tiers_supplier ON research_price_tiers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_research_landed_cost_idea ON research_landed_cost_scenarios(product_idea_id);
CREATE INDEX IF NOT EXISTS idx_research_profitability_idea ON research_profitability_scenarios(product_idea_id);
CREATE INDEX IF NOT EXISTS idx_research_opportunity_idea ON research_opportunity_scores(product_idea_id);

-- ============================================
-- Row Level Security — owner-scoped (user_id = auth.uid()), matching the
-- pattern used for tenant-scoped tables elsewhere in this schema.
-- ============================================

ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_supplier_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_landed_cost_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_profitability_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_opportunity_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access for research_projects" ON research_projects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owner access for product_ideas" ON product_ideas
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Owner access for research_suppliers" ON research_suppliers
  FOR ALL USING (product_idea_id IN (SELECT id FROM product_ideas WHERE user_id = auth.uid()));

CREATE POLICY "Owner access for research_price_tiers" ON research_price_tiers
  FOR ALL USING (supplier_id IN (
    SELECT s.id FROM research_suppliers s
    JOIN product_ideas pi ON pi.id = s.product_idea_id
    WHERE pi.user_id = auth.uid()
  ));

CREATE POLICY "Owner access for research_supplier_scores" ON research_supplier_scores
  FOR ALL USING (supplier_id IN (
    SELECT s.id FROM research_suppliers s
    JOIN product_ideas pi ON pi.id = s.product_idea_id
    WHERE pi.user_id = auth.uid()
  ));

CREATE POLICY "Owner access for research_landed_cost_scenarios" ON research_landed_cost_scenarios
  FOR ALL USING (product_idea_id IN (SELECT id FROM product_ideas WHERE user_id = auth.uid()));

CREATE POLICY "Owner access for research_profitability_scenarios" ON research_profitability_scenarios
  FOR ALL USING (product_idea_id IN (SELECT id FROM product_ideas WHERE user_id = auth.uid()));

CREATE POLICY "Owner access for research_opportunity_scores" ON research_opportunity_scores
  FOR ALL USING (product_idea_id IN (SELECT id FROM product_ideas WHERE user_id = auth.uid()));

CREATE POLICY "Owner access for research_usage" ON research_usage
  FOR ALL USING (user_id = auth.uid());

COMMENT ON TABLE product_ideas IS 'A product a user is researching. tenant_id/product_id are populated only when promoted into a real storefront product via the Build-my-store bridge.';
COMMENT ON COLUMN product_ideas.status IS 'researching | launch_ready | promoted | archived — launch_ready is set when the decision cockpit verdict is Launch or Sample First.';
