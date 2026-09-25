-- Early-access signups for LaunchGrid Reconcile.
--
-- The demand signal IS the experiment: someone who uploads a payout file, sees
-- findings and then asks for recurring checks is the only evidence that this
-- is a business. Without somewhere to record that, the landing page can only
-- measure traffic, which tells us nothing.
--
-- Deliberately minimal. No account, no auth, no profile — an email address and
-- enough context to know which page and which offer produced it.

CREATE TABLE IF NOT EXISTS early_access_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  -- Which landing page or tool produced this, e.g. 'shopify-reconcile'.
  source TEXT NOT NULL,
  -- Anything worth knowing at signup time: whether they had already run a
  -- reconciliation, how many findings it produced. Never the file itself and
  -- never a row from it — the promise is that payout data stays in the browser.
  context JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- One row per email per source: a second submission updates rather than
-- duplicating, so the list stays countable.
CREATE UNIQUE INDEX IF NOT EXISTS early_access_email_source_idx
  ON early_access_signups (lower(email), source);

ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- No policies: the table is written only by the service role through the API
-- route, and read only from the Supabase dashboard. RLS on with no policy
-- means the anon key cannot read the list, which is the point — an email list
-- readable by anyone with the publishable key is a leak.
