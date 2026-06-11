-- Migration 0009: Add custom meta SEO fields to products and business_configs
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;

ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS meta_description TEXT;
