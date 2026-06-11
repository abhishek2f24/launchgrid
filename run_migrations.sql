-- ============================================================
-- LaunchGrid — Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/pxbyhxjjepjuchalaola/sql/new
-- ============================================================

-- Migration 0016: COD enabled flag
ALTER TABLE business_configs
  ADD COLUMN IF NOT EXISTS cod_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN business_configs.cod_enabled IS
  'When true, the store accepts Cash on Delivery orders with OTP phone verification.';

-- Migration 0017: Trial email columns (rename 18h/23h → day5/day6)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_email_day5_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_email_day6_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill from old columns if they exist (safe no-op if they don't)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='subscriptions' AND column_name='trial_email_18h_sent') THEN
    UPDATE subscriptions SET trial_email_day5_sent = TRUE WHERE trial_email_18h_sent IS TRUE;
    UPDATE subscriptions SET trial_email_day6_sent = TRUE WHERE trial_email_23h_sent IS TRUE;
  END IF;
END $$;

COMMENT ON COLUMN subscriptions.trial_email_day5_sent IS 'Day-5 trial nudge sent (2 days remaining)';
COMMENT ON COLUMN subscriptions.trial_email_day6_sent IS 'Day-6 trial nudge sent (24 hours remaining)';

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('business_configs', 'subscriptions')
  AND column_name IN ('cod_enabled', 'trial_email_day5_sent', 'trial_email_day6_sent')
ORDER BY table_name, column_name;
