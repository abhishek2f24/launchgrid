-- Rate-limits AI image generation for the social-post generator to 3/day
-- per tenant (text/caption generation is cheap and stays unlimited — only
-- the image-generation call is metered here).

CREATE TABLE IF NOT EXISTS social_post_image_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_post_image_gen_tenant_day
  ON social_post_image_generations (tenant_id, created_at DESC);

ALTER TABLE social_post_image_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for social_post_image_generations" ON social_post_image_generations;
CREATE POLICY "Tenant isolation for social_post_image_generations" ON social_post_image_generations
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));
