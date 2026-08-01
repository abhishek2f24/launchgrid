-- On-demand research: a customer can request a report for ANY product, including
-- ones not already in the catalogue.
--
-- THE RISK THIS SCHEMA EXISTS TO CONTAIN
--   Fulfilment depends on scraping supplier sites, which can and does fail —
--   IndiaMART returns HTTP 429 under sustained load and Alibaba serves a CAPTCHA.
--   So a request must never be able to consume a customer's credit unless a report
--   that clears an explicit quality bar actually exists. Everything below is built
--   around that single rule.
--
-- WHY AN APPEND-ONLY LEDGER RATHER THAN A BALANCE COLUMN
--   A mutable `credits_remaining` integer loses updates under concurrency and leaves
--   no audit trail when a customer disputes a charge. Balance is derived as
--   SUM(delta), and every movement carries the request that caused it.
--
-- CREDIT LIFECYCLE
--   purchase  +N  when a pack is bought
--   hold      -1  the instant a request is queued  (reserves it; blocks overspend)
--   refund    +1  if the request fails or misses the quality bar
--   A delivered report simply leaves the hold in place — there is no separate
--   "consume" step to forget to run.

DO $$ BEGIN
  CREATE TYPE research_credit_entry_kind AS ENUM ('purchase', 'hold', 'refund', 'grant', 'expiry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE research_request_status AS ENUM ('queued', 'running', 'delivered', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS research_report_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- What the customer typed. Kept verbatim for support and for re-running.
  requested_query TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  status research_request_status NOT NULL DEFAULT 'queued',
  -- Populated once fulfilment creates or matches an idea. Nullable: a queued request has none yet.
  product_idea_id UUID REFERENCES product_ideas(id) ON DELETE SET NULL,
  -- Set when an existing researched product already satisfies the request, so it is
  -- served from cache instantly and the hold is refunded.
  served_from_cache BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  -- The quality-gate verdict, stored so a delivery decision is auditable after the fact.
  quality_report JSONB,
  -- What the customer was promised, so the UI never invents an ETA.
  promised_by TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '6 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_research_requests_user ON research_report_requests (user_id, created_at DESC);
-- The worker's claim query: oldest queued first.
CREATE INDEX IF NOT EXISTS idx_research_requests_queue ON research_report_requests (status, created_at) WHERE status IN ('queued', 'running');
-- Cache lookups by normalized query.
CREATE INDEX IF NOT EXISTS idx_research_requests_norm ON research_report_requests (normalized_query);

CREATE TABLE IF NOT EXISTS research_credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind research_credit_entry_kind NOT NULL,
  -- Signed: purchase/grant/refund are positive, hold is negative.
  delta INTEGER NOT NULL,
  request_id UUID REFERENCES research_report_requests(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT delta_sign_matches_kind CHECK (
    (kind = 'hold' AND delta < 0) OR
    (kind = 'expiry' AND delta < 0) OR
    (kind IN ('purchase', 'refund', 'grant') AND delta > 0)
  )
);

CREATE INDEX IF NOT EXISTS idx_research_credit_ledger_user ON research_credit_ledger (user_id, created_at DESC);

-- One hold and at most one refund per request. This is what makes double-refund
-- (and therefore free reports) impossible even if the worker retries or two
-- processes race on the same request.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_hold_per_request
  ON research_credit_ledger (request_id) WHERE kind = 'hold';
CREATE UNIQUE INDEX IF NOT EXISTS uniq_credit_refund_per_request
  ON research_credit_ledger (request_id) WHERE kind = 'refund';

ALTER TABLE research_report_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_credit_ledger ENABLE ROW LEVEL SECURITY;

-- Customers may read their own requests and ledger. They may NOT write either:
-- credits are minted by the payment webhook and spent by the worker, both of
-- which use the service role. A client-side INSERT would be free money.
DROP POLICY IF EXISTS "Owner reads research_report_requests" ON research_report_requests;
CREATE POLICY "Owner reads research_report_requests"
  ON research_report_requests FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner reads research_credit_ledger" ON research_credit_ledger;
CREATE POLICY "Owner reads research_credit_ledger"
  ON research_credit_ledger FOR SELECT USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.research_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(SUM(delta), 0)::INTEGER FROM research_credit_ledger WHERE user_id = p_user_id;
$$;

-- Queue a request and reserve a credit in one transaction.
--
-- Placing the hold in the same statement that checks the balance is what stops two
-- concurrent requests from both seeing "1 credit left" and both proceeding. If the
-- balance is insufficient the whole thing rolls back and no request row survives.
-- SECURITY DEFINER on purpose: there is deliberately no INSERT policy on either table,
-- because a client able to INSERT into research_credit_ledger could mint its own
-- credits. All writes funnel through this function, which derives the owner from
-- auth.uid() and can only ever write rows for the caller.
CREATE OR REPLACE FUNCTION public.request_research_report(p_query TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_balance INTEGER;
  v_request_id UUID;
  v_norm TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  v_norm := lower(regexp_replace(trim(p_query), '\s+', ' ', 'g'));
  IF length(v_norm) < 3 THEN
    RAISE EXCEPTION 'Query too short';
  END IF;

  -- Lock this user's ledger rows so a concurrent call cannot read a stale balance.
  PERFORM 1 FROM research_credit_ledger WHERE user_id = v_user_id FOR UPDATE;

  SELECT research_credit_balance(v_user_id) INTO v_balance;
  IF v_balance < 1 THEN
    RAISE EXCEPTION 'No research credits remaining';
  END IF;

  INSERT INTO research_report_requests (user_id, requested_query, normalized_query)
  VALUES (v_user_id, p_query, v_norm)
  RETURNING id INTO v_request_id;

  INSERT INTO research_credit_ledger (user_id, kind, delta, request_id, note)
  VALUES (v_user_id, 'hold', -1, v_request_id, 'Reserved for research request');

  RETURN v_request_id;
END;
$$;

-- Return the credit for a request that failed, missed the quality bar, or was
-- served from cache. Idempotent: the unique refund index means a second call is a
-- no-op rather than an error, so worker retries cannot mint credits.
CREATE OR REPLACE FUNCTION public.refund_research_request(p_request_id UUID, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM research_report_requests WHERE id = p_request_id;
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO research_credit_ledger (user_id, kind, delta, request_id, note)
  VALUES (v_user_id, 'refund', 1, p_request_id, COALESCE(p_reason, 'Refunded'))
  ON CONFLICT DO NOTHING;

  RETURN TRUE;
END;
$$;

-- Customers queue their own requests; only the worker (service role) may refund.
GRANT EXECUTE ON FUNCTION public.request_research_report(TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.refund_research_request(UUID, TEXT) FROM PUBLIC, anon, authenticated;
