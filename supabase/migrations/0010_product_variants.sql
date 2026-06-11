-- Migration 0010: Product variants and stock management

-- 1. Add fields to products table for simple product stock and variants toggle
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 50;

-- 2. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL, -- e.g. "S / Red" or "Blue"
  sku TEXT,
  price NUMERIC(10,2), -- optional price override
  stock INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, title)
);

-- 3. Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Only the tenant owner can manage their own product variants
CREATE POLICY "Tenant isolation for product_variants" ON product_variants
  FOR ALL USING (
    product_id IN (
      SELECT id FROM products WHERE tenant_id IN (
        SELECT id FROM tenants WHERE owner_id = auth.uid()
      )
    )
  );

-- Anyone can select active product variants
CREATE POLICY "Public read access to product_variants" ON product_variants
  FOR SELECT TO public USING (true);
