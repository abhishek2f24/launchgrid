-- Migration 0008: Add coupons table and coupon tracking columns to orders

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_shipping')),
  value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for coupons" ON coupons
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Allow public read access to coupons for checkout validation
CREATE POLICY "Public read access to coupons" ON coupons
  FOR SELECT TO public USING (is_active = true);

-- Add discount tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
