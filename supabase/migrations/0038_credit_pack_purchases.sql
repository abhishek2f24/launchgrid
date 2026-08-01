-- Credit-pack purchases.
--
-- Razorpay retries webhooks until it gets a 2xx, and can deliver the same
-- payment.captured event more than once. Without a key tied to the payment itself, a
-- retry grants the pack again — free credits, silently. `payment_ref` plus a unique
-- index makes the grant idempotent at the database level rather than relying on the
-- handler getting its control flow right.

ALTER TABLE research_credit_ledger ADD COLUMN IF NOT EXISTS payment_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_ledger_payment_ref
  ON research_credit_ledger (payment_ref) WHERE payment_ref IS NOT NULL;

-- Grants a purchased pack. Returns the new balance, or NULL if this payment was
-- already credited (the caller should treat that as success, not an error).
CREATE OR REPLACE FUNCTION public.grant_research_credits_for_payment(
  p_tenant_id UUID, p_amount INTEGER, p_payment_ref TEXT, p_note TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_inserted UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  IF p_payment_ref IS NULL OR length(trim(p_payment_ref)) = 0 THEN
    RAISE EXCEPTION 'payment_ref is required for a purchase';
  END IF;

  SELECT owner_id INTO v_owner FROM tenants WHERE id = p_tenant_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Unknown account';
  END IF;

  INSERT INTO research_credit_ledger (user_id, tenant_id, kind, delta, note, payment_ref)
  VALUES (v_owner, p_tenant_id, 'purchase', p_amount, p_note, p_payment_ref)
  ON CONFLICT (payment_ref) WHERE payment_ref IS NOT NULL DO NOTHING
  RETURNING id INTO v_inserted;

  IF v_inserted IS NULL THEN
    RETURN NULL;  -- already credited; a webhook retry
  END IF;

  RETURN research_credit_balance(p_tenant_id);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_research_credits_for_payment(UUID, INTEGER, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
