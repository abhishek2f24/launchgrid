-- Migration 0022: Metadata and Webhooks Subsystem
-- Adds webhook subscription tables and JSONB metadata columns to products, orders, and tenants.

-- 1. Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. 'order.paid', 'order.created'
  target_url TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, event_type, target_url)
);

-- Enable RLS
ALTER TABLE webhook_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY "Tenant isolation for webhook_subscriptions" ON webhook_subscriptions
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- 2. Add JSONB metadata columns to products, orders, and tenants for extensibility
ALTER TABLE products ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb NOT NULL;

COMMENT ON TABLE webhook_subscriptions IS 'Stores external webhook subscriptions for tenants to integrate custom workflows.';
COMMENT ON COLUMN products.metadata IS 'Custom attributes and metadata for zero-migration product extensions.';
COMMENT ON COLUMN orders.metadata IS 'Custom attributes and metadata for zero-migration order extensions.';
COMMENT ON COLUMN tenants.metadata IS 'Custom attributes and metadata for zero-migration tenant extensions.';
