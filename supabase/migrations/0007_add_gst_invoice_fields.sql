-- Migration 0007: Add GST invoice fields and storefront copy fields to business_configs

ALTER TABLE business_configs
  ADD COLUMN IF NOT EXISTS gstin TEXT,            -- 15-char GSTIN, shown on tax invoices
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC DEFAULT 18,  -- GST rate %; configurable per category
  ADD COLUMN IF NOT EXISTS tagline TEXT,          -- Store hero headline
  ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;    -- Store hero subtext
