-- Research credits belong to the ACCOUNT (tenant), not the individual user.
--
-- WHY
--   The product model is now: credits buy research, subscription buys the storefront.
--   Those are different things with different lifecycles, so credits must survive
--   independently of a plan and be shared by everyone on the account. Scoping the
--   ledger to user_id meant a second person on the same business had a separate
--   balance, and credits bought by the owner were invisible to them.
--
--   user_id is KEPT on both tables, but demoted to "who did this" for audit. tenant_id
--   is the money boundary. Both columns matter: refunds and disputes need to know the
--   account, support needs to know the person.

ALTER TABLE research_credit_ledger ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE research_report_requests ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Backfill from the owning tenant before enforcing NOT NULL. Rows whose user has no
-- tenant cannot be attributed to an account and are deleted rather than guessed at —
-- a credit on the wrong account is worse than no credit.
UPDATE research_credit_ledger l
SET tenant_id = t.id
FROM tenants t
WHERE t.owner_id = l.user_id AND l.tenant_id IS NULL;

UPDATE research_report_requests r
SET tenant_id = t.id
FROM tenants t
WHERE t.owner_id = r.user_id AND r.tenant_id IS NULL;

DELETE FROM research_credit_ledger WHERE tenant_id IS NULL;
DELETE FROM research_report_requests WHERE tenant_id IS NULL;

ALTER TABLE research_credit_ledger ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE research_report_requests ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_research_credit_ledger_tenant ON research_credit_ledger (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_requests_tenant ON research_report_requests (tenant_id, created_at DESC);

-- Balance is now per account.
DROP FUNCTION IF EXISTS public.research_credit_balance(UUID);

CREATE OR REPLACE FUNCTION public.research_credit_balance(p_tenant_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER FROM research_credit_ledger WHERE tenant_id = p_tenant_id;
$$;

-- Resolves the account for the current caller. Single-owner tenants today; when
-- staff accounts arrive this is the one place that needs to change.
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id FROM tenants WHERE owner_id = auth.uid() ORDER BY created_at LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.request_research_report(p_query TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance INTEGER;
  v_request_id UUID;
  v_norm TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO v_tenant_id FROM tenants WHERE owner_id = v_user_id ORDER BY created_at LIMIT 1;
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'No account found for this user';
  END IF;

  v_norm := lower(regexp_replace(trim(p_query), '\s+', ' ', 'g'));
  IF length(v_norm) < 3 THEN
    RAISE EXCEPTION 'Query too short';
  END IF;

  -- Lock the ACCOUNT's ledger so two people on the same account cannot both spend
  -- the last credit.
  PERFORM 1 FROM research_credit_ledger WHERE tenant_id = v_tenant_id FOR UPDATE;

  SELECT research_credit_balance(v_tenant_id) INTO v_balance;
  IF v_balance < 1 THEN
    RAISE EXCEPTION 'No research credits remaining';
  END IF;

  INSERT INTO research_report_requests (user_id, tenant_id, requested_query, normalized_query)
  VALUES (v_user_id, v_tenant_id, p_query, v_norm)
  RETURNING id INTO v_request_id;

  INSERT INTO research_credit_ledger (user_id, tenant_id, kind, delta, request_id, note)
  VALUES (v_user_id, v_tenant_id, 'hold', -1, v_request_id, 'Reserved for research request');

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_research_request(p_request_id UUID, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT user_id, tenant_id INTO v_user_id, v_tenant_id
  FROM research_report_requests WHERE id = p_request_id;
  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Idempotent via uniq_credit_refund_per_request: a worker retry cannot mint credits.
  INSERT INTO research_credit_ledger (user_id, tenant_id, kind, delta, request_id, note)
  VALUES (v_user_id, v_tenant_id, 'refund', 1, p_request_id, COALESCE(p_reason, 'Refunded'))
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Credits a purchased pack to an account. Service-role only — this is money creation.
CREATE OR REPLACE FUNCTION public.grant_research_credits(
  p_tenant_id UUID, p_amount INTEGER, p_kind research_credit_entry_kind, p_note TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  SELECT owner_id INTO v_owner FROM tenants WHERE id = p_tenant_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Unknown account';
  END IF;

  INSERT INTO research_credit_ledger (user_id, tenant_id, kind, delta, note)
  VALUES (v_owner, p_tenant_id, p_kind, p_amount, p_note);

  RETURN research_credit_balance(p_tenant_id);
END;
$$;

-- Read policies follow the codebase's existing tenant idiom, so credits are visible
-- to everyone on the account rather than only to the person who spent them.
DROP POLICY IF EXISTS "Owner reads research_report_requests" ON research_report_requests;
CREATE POLICY "Account reads research_report_requests"
  ON research_report_requests FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owner reads research_credit_ledger" ON research_credit_ledger;
CREATE POLICY "Account reads research_credit_ledger"
  ON research_credit_ledger FOR SELECT
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

GRANT EXECUTE ON FUNCTION public.request_research_report(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.research_credit_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
REVOKE ALL ON FUNCTION public.refund_research_request(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_research_credits(UUID, INTEGER, research_credit_entry_kind, TEXT) FROM PUBLIC, anon, authenticated;
