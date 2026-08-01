-- Product Investigation Workspace.
--
-- ONE PRODUCT, ONE DECISION, ₹20,000.
--
-- This is not a research report. It is a working file for a single buying decision, and
-- it exists to answer BUY / WAIT / REJECT with evidence a person can defend.
--
-- WHAT IS DELIBERATELY ABSENT
--   No score column. No weights. No opportunity rating. The V2 audit found ~49% of the
--   flagship score had no data source, and the fix is not a better formula — it is not
--   having a formula. The verdict comes from gates over claims, and every claim traces
--   to evidence in the store.
--
-- MANUAL ENTRY IS FIRST-CLASS
--   Paid marketplace APIs do not exist yet, so a human types what they see on Amazon.
--   That is evidence — recorded with method 'user' and a confidence that says so. It is
--   worth far more than an invented number, and far less than an API reading. The system
--   must be able to tell those apart, which is exactly what the evidence store does.

CREATE TABLE IF NOT EXISTS investigations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  product_name  TEXT NOT NULL,
  -- The subject every piece of evidence in this investigation attaches to. Generated
  -- here rather than reusing product_ideas.id so an investigation can be opened for a
  -- product that is not in the catalogue at all — which is the normal case for the first
  -- real purchase.
  subject_id    UUID NOT NULL DEFAULT uuid_generate_v4(),

  -- The money actually on the table. Drives the capital-fit gate, so it is required
  -- rather than an optional preference.
  budget_inr    NUMERIC NOT NULL DEFAULT 20000,

  -- Set only when the investigator commits. Kept separate from the computed verdict so
  -- we can later compare what the engine said against what the human did — the seed of
  -- the outcome-learning loop.
  decision      TEXT CHECK (decision IN ('BUY', 'WAIT', 'REJECT')),
  decided_at    TIMESTAMPTZ,
  decision_note TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_investigations_user ON investigations (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investigations_subject ON investigations (subject_id);

-- Investigation tasks — the smallest next action that resolves an unknown.
--
-- Generated from missing claims rather than authored, so the checklist is always a
-- direct function of what is actually unknown. Completing one raises evidence coverage;
-- that is the only way coverage ever goes up.
CREATE TABLE IF NOT EXISTS investigation_tasks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investigation_id UUID NOT NULL REFERENCES investigations(id) ON DELETE CASCADE,

  -- Which unknown this action exists to resolve. Unique per investigation so the
  -- generator can re-run on every page load without accumulating duplicates.
  resolves         TEXT NOT NULL,
  action           TEXT NOT NULL,
  cost_inr         NUMERIC NOT NULL DEFAULT 0,
  effort           TEXT NOT NULL DEFAULT 'minutes',

  done             BOOLEAN NOT NULL DEFAULT FALSE,
  done_at          TIMESTAMPTZ,
  result_note      TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (investigation_id, resolves)
);

CREATE INDEX IF NOT EXISTS idx_investigation_tasks
  ON investigation_tasks (investigation_id, done, cost_inr);

ALTER TABLE investigations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_tasks  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner access to investigations" ON investigations;
CREATE POLICY "Owner access to investigations"
  ON investigations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owner access to investigation tasks" ON investigation_tasks;
CREATE POLICY "Owner access to investigation tasks"
  ON investigation_tasks FOR ALL
  USING (investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid()))
  WITH CHECK (investigation_id IN (SELECT id FROM investigations WHERE user_id = auth.uid()));
