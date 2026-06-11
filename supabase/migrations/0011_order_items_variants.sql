-- Migration 0011: Add variant support to order_items

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_title TEXT;
