-- Migration 0024: Decision Cockpit fields for the Research module
-- Adds the two inputs the readiness-matrix/recommended-order/decision-
-- confidence engines need that weren't captured in 0023: a safe first-order
-- budget ceiling, and whether compliance evidence has actually been seen
-- (vs. just claimed) — both drive real, non-fabricated risk signals rather
-- than guesses.

ALTER TABLE product_ideas ADD COLUMN IF NOT EXISTS max_initial_investment NUMERIC(12,2);
ALTER TABLE product_ideas ADD COLUMN IF NOT EXISTS has_compliance_evidence BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN product_ideas.max_initial_investment IS 'Merchant-set ceiling for a first pilot order, in INR. Drives the recommended test quantity and inventory-risk banding.';
COMMENT ON COLUMN product_ideas.has_compliance_evidence IS 'Set true only once real compliance/registration documents (not just a supplier claim) have been reviewed. Drives the Compliance readiness dimension and the decision-confidence range.';
