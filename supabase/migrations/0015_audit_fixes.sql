-- Migration 0015: Audit fixes — referral enum, clicks table, credit columns

-- 1. Add 'paid' value to referral_status_enum (was missing, causing DB error on activation)
ALTER TYPE referral_status_enum ADD VALUE IF NOT EXISTS 'paid';

-- 2. Create referral_clicks table (referenced in /r/[code] but never created)
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  referrer_code TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_clicks_referrer_idx ON referral_clicks(referrer_tenant_id);

-- 3. Add referral_credit_days to subscriptions (referenced in activate route but missing)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS referral_credit_days INT NOT NULL DEFAULT 0;

-- 4. Add pending_credit_days and activated_at to referrals (referenced in activate route)
ALTER TABLE referrals
  ADD COLUMN IF NOT EXISTS pending_credit_days INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;

-- 5. RLS for referral_clicks (service role can insert, owners can read their own)
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert referral clicks" ON referral_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can view their referral clicks" ON referral_clicks
  FOR SELECT USING (
    referrer_tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );
