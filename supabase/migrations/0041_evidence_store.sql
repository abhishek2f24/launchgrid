-- PHASE 0 — the evidence store.
--
-- THE THESIS
--   The architecture is copyable in a weekend; the accumulated evidence is not. So the
--   design goal is maximum evidence retained per rupee spent, kept forever, never
--   overwritten. Everything above this layer is rebuildable from it.
--
-- WHAT THIS REPLACES
--   The audited V2 engine computed a 100-point score in which ~49% of the weight had no
--   data source and a further 18% silently resolved to a neutral 50. Absent evidence was
--   indistinguishable from average evidence. This schema makes that state impossible to
--   represent: a claim either cites evidence or reports itself unknown.
--
-- THREE RULES ENCODED HERE
--   1. Raw responses are archived before parsing. When a selector turns out to be wrong
--      — and one already did — history is re-parsed rather than re-purchased.
--   2. Observations are append-only. A price of 599 in January and 649 in February are
--      two facts, not one mutated field. The history IS the asset.
--   3. Nothing is deleted. A supplier that disappears is evidence; a listing that dies is
--      demand evidence.

-- ---------------------------------------------------------------------------
-- L0 — raw captures. The archive.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_captures (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source       TEXT NOT NULL,            -- 'keepa' | 'indiamart' | 'volza' | 'google_trends'
  url          TEXT,
  request      JSONB,                    -- exact parameters, so the fetch is reproducible
  -- sha256 of the body. Deduplicates identical captures so a re-fetch of unchanged
  -- content costs storage once, and lets us prove what we saw.
  body_hash    TEXT NOT NULL,
  -- Object-storage key. Bodies never live in Postgres: they are large, cold, and would
  -- make every table scan expensive.
  storage_key  TEXT NOT NULL,
  byte_size    INTEGER,
  status       INTEGER,
  -- What this fetch cost, in paise. Not bookkeeping — this is how we learn which
  -- sources earn their price, and it drives the per-report unit economics.
  cost_paise   INTEGER NOT NULL DEFAULT 0,
  captured_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, body_hash)
);

CREATE INDEX IF NOT EXISTS idx_raw_captures_source ON raw_captures (source, captured_at DESC);

-- ---------------------------------------------------------------------------
-- L1 — evidence. Atomic observations.
-- ---------------------------------------------------------------------------
--
-- WHY predicate/value RATHER THAN COLUMNS
--   We cannot know today which facts matter in two years. A wide table forces a
--   migration per new fact type; this does not. The cost is weaker type safety at the
--   DB boundary, which is paid back by strict typing in the derivation layer.
--
-- WHY subject IS CONCRETE
--   Evidence attaches to things that can be observed and resolved — a listing, a
--   supplier, a review. Deliberately NOT to an "opportunity": an opportunity has no
--   external identifier, cannot be deduplicated, and is an inference over evidence
--   rather than a thing evidence is about. Opportunities are derived upstack.

DO $$ BEGIN
  CREATE TYPE evidence_method AS ENUM ('api', 'document', 'parsed', 'user', 'inferred');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS evidence (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  subject_type   TEXT NOT NULL,          -- 'product' | 'supplier' | 'listing' | 'market'
  subject_id     UUID NOT NULL,
  predicate      TEXT NOT NULL,          -- 'unit_price' | 'monthly_sales' | 'moq' | ...
  value          JSONB NOT NULL,
  unit           TEXT,                   -- 'INR' | 'units_per_month' | 'days'

  capture_id     UUID REFERENCES raw_captures(id),
  method         evidence_method NOT NULL,
  parser_version TEXT,

  -- Earned, not asserted. See confidence() in src/lib/intelligence/claim.ts — a value
  -- here is the observation's standalone reliability, before freshness decay and
  -- cross-source agreement are applied at claim time.
  confidence     NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  observed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Staleness is per-predicate, not global: a price rots in 30 days, a factory address
  -- in a year. Stored per row so the TTL policy at capture time is preserved even if
  -- the policy later changes.
  ttl_days       INTEGER NOT NULL,

  -- Append-only correction. A wrong observation is never edited or deleted; a new row
  -- supersedes it, and the original remains auditable.
  superseded_by  UUID REFERENCES evidence(id),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- A parsed observation must say which parser produced it, or it cannot be
  -- re-validated when that parser is later found wrong.
  CONSTRAINT parsed_evidence_needs_parser_version
    CHECK (method <> 'parsed' OR parser_version IS NOT NULL)
);

-- The hot path: "all current observations of predicate P about subject S".
CREATE INDEX IF NOT EXISTS idx_evidence_subject
  ON evidence (subject_type, subject_id, predicate, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_live
  ON evidence (subject_type, subject_id, predicate) WHERE superseded_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_capture ON evidence (capture_id);

-- ---------------------------------------------------------------------------
-- L2 — claim snapshots.
-- ---------------------------------------------------------------------------
--
-- Claims are DERIVED and recomputed on read, so this table is not a source of truth.
-- It exists so a memo issued months ago can be explained exactly as it was issued —
-- including the evidence it rested on and the coverage it had at the time. Without
-- this, "why did you tell me to buy?" is unanswerable after the evidence moves on.
CREATE TABLE IF NOT EXISTS claim_snapshots (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_type TEXT NOT NULL,
  subject_id   UUID NOT NULL,
  predicate    TEXT NOT NULL,
  value        JSONB,                    -- NULL is meaningful: "unknown"
  unit         TEXT,
  confidence   NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  coverage     NUMERIC NOT NULL CHECK (coverage >= 0 AND coverage <= 1),
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  assumptions  JSONB NOT NULL DEFAULT '[]',
  contradictions JSONB NOT NULL DEFAULT '[]',
  derived_by   TEXT NOT NULL,            -- 'demand@2.1.0' — versioned and replayable
  stale_at     TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- THE COVERAGE CONTRACT, enforced by the database.
  --
  -- This single constraint is the fix for the defect the V2 audit found: a claim that
  -- asserts a value MUST cite evidence. "We have no data" can only be expressed as a
  -- NULL value, never as a neutral default that reads like a measurement.
  CONSTRAINT valued_claim_requires_evidence
    CHECK (value IS NULL OR (coverage > 0 AND array_length(evidence_ids, 1) >= 1))
);

CREATE INDEX IF NOT EXISTS idx_claim_snapshots_subject
  ON claim_snapshots (subject_type, subject_id, predicate, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Evidence is shared infrastructure, not per-tenant data: the same observation about a
-- product serves every customer, which is what makes the cache the business model.
-- It is therefore service-role only — no client reads or writes it directly. Customer
-- access happens through derived reports, which apply their own entitlement rules.
ALTER TABLE raw_captures    ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence        ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_snapshots ENABLE ROW LEVEL SECURITY;
-- No policies are created deliberately: with RLS on and no policy, only the service
-- role can reach these tables.
