-- Fair-use ceiling on on-demand research requests.
--
-- WHY
--   The top tier grants "unlimited" research credits, but every fulfilled request is
--   real residential-proxy spend (~₹2–5). Literally uncapped means a scripted client
--   could run 10,000 requests and cost ~₹50,000 against a ₹9,999 plan. The cap sits
--   far above genuine merchant use and only bites automated bulk use.
--
--   Enforced in the database rather than the UI so it holds for every caller — web,
--   mobile and any future API client alike.

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
  v_today_count INTEGER;
  v_fair_use CONSTANT INTEGER := 50;
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

  -- Fair use, counted per account per rolling day. Refunded requests still count:
  -- they consumed the proxy fetch, which is the cost being protected.
  SELECT COUNT(*) INTO v_today_count
  FROM research_report_requests
  WHERE tenant_id = v_tenant_id AND created_at > now() - INTERVAL '1 day';

  IF v_today_count >= v_fair_use THEN
    RAISE EXCEPTION 'Daily research limit reached (% requests in 24h). This is a fair-use cap, not a plan limit.', v_fair_use;
  END IF;

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

GRANT EXECUTE ON FUNCTION public.request_research_report(TEXT) TO authenticated;
