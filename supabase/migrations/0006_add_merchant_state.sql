-- Migration 0006: Add merchant state column to business_configs
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Maharashtra';
