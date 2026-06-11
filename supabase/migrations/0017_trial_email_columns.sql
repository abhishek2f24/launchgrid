-- Migration: 0017_trial_email_columns
-- Renames 18h/23h trial email flags to day5/day6 to match 7-day trial cadence.
-- Also adds the columns if they don't already exist (safe to re-run).

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_email_day5_sent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_email_day6_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Copy any existing 18h/23h sent flags to the new columns
-- (so active trials don't get duplicate emails after this migration)
UPDATE subscriptions
  SET trial_email_day5_sent = TRUE
  WHERE trial_email_18h_sent IS TRUE;

UPDATE subscriptions
  SET trial_email_day6_sent = TRUE
  WHERE trial_email_23h_sent IS TRUE;

COMMENT ON COLUMN subscriptions.trial_email_day5_sent IS 'Day-5 trial nudge sent (2 days remaining)';
COMMENT ON COLUMN subscriptions.trial_email_day6_sent IS 'Day-6 trial nudge sent (24 hours remaining)';
