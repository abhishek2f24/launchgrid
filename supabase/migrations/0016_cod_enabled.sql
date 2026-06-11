-- Migration: 0016_cod_enabled
-- Adds cod_enabled flag to business_configs for Cash on Delivery feature
-- Merchants can toggle COD on/off from their payments settings page.

ALTER TABLE business_configs
  ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN business_configs.cod_enabled IS
  'When true, the store accepts Cash on Delivery orders with OTP phone verification.';
