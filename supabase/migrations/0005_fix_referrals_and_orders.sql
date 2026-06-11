-- Migration 0005: Fix referrals and orders schema
-- Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS line_items JSONB;

-- Add missing columns to referrals table
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_user_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_code TEXT;

-- Add unique constraint to referrals(referred_user_id) to avoid duplicate referral logging
ALTER TABLE referrals ADD CONSTRAINT unique_referred_user_id UNIQUE (referred_user_id);

-- Add missing column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referral_credit_days INT NOT NULL DEFAULT 0;
