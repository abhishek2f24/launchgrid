-- Add rzp_key_secret column to business_configs table to resolve query error
ALTER TABLE business_configs ADD COLUMN IF NOT EXISTS rzp_key_secret TEXT;
