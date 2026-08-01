-- Free tier gets ONE research, not two.
--
-- WHY
--   The second free report is the one that converts. A new user spends the first on
--   the product they already had in mind; if a second is free they answer their real
--   question and leave. One report proves the product works and leaves the actual
--   decision behind the paywall.
--
--   The limit lives in two places — this function and src/lib/plans.ts. Both are
--   changed together; the function is the enforcement point and plans.ts is what the
--   UI displays, so a mismatch shows the customer a number the server won't honour.

CREATE OR REPLACE FUNCTION public.finalize_research_report(p_product_idea_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_period_month DATE := date_trunc('month', now() AT TIME ZONE 'UTC')::date;
  v_limit INTEGER;
  v_completion_id UUID;
  v_usage_id UUID;
  v_tier TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM product_ideas
    WHERE id = p_product_idea_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Product idea not found';
  END IF;

  SELECT s.plan_tier
  INTO v_tier
  FROM subscriptions s
  JOIN tenants t ON t.id = s.tenant_id
  WHERE t.owner_id = v_user_id AND s.status = 'active'
  ORDER BY CASE s.plan_tier
    WHEN 'premium' THEN 4
    WHEN 'pro' THEN 3
    WHEN 'starter' THEN 2
    ELSE 1
  END DESC
  LIMIT 1;

  v_limit := CASE v_tier
    WHEN 'starter' THEN 25
    WHEN 'pro' THEN 250
    WHEN 'premium' THEN 500
    ELSE 1   -- free tier: a single taste, was 2
  END;

  INSERT INTO research_report_completions (product_idea_id, user_id)
  VALUES (p_product_idea_id, v_user_id)
  ON CONFLICT (product_idea_id) DO NOTHING
  RETURNING id INTO v_completion_id;

  -- A completed report is idempotent and never consumes a second credit.
  IF v_completion_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO research_usage (user_id, period_month, ideas_created, reports_completed)
  VALUES (v_user_id, v_period_month, 0, 1)
  ON CONFLICT (user_id, period_month) DO UPDATE
    SET reports_completed = research_usage.reports_completed + 1
    WHERE research_usage.reports_completed < v_limit
  RETURNING id INTO v_usage_id;

  IF v_usage_id IS NULL THEN
    -- RAISE aborts the transaction, so the completion row inserted above is rolled
    -- back with it. The report is neither delivered nor counted.
    RAISE EXCEPTION 'Research report limit reached for this billing month';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.finalize_research_report(UUID) TO authenticated;
