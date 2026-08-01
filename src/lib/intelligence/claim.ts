// The claim model — Phase 0 of the Product Intelligence architecture.
//
// WHAT THIS FIXES
//   The audited V2 engine produced a 100-point score in which ~49% of the weight had no
//   data source, and a further 18% silently resolved to a neutral 50 because its inputs
//   were NULL. Absent evidence and average evidence were indistinguishable, so a report
//   built on 51% coverage rendered identically to one built on 95%.
//
// THE FIX IS STRUCTURAL, NOT PROCEDURAL
//   A code-review rule ("don't write `?? 50`") fails eventually. Instead a valued claim
//   is *unrepresentable* without evidence: the only constructors are `known()`, which
//   demands non-empty evidence, and `unknown()`, which cannot carry a value. There is no
//   third way to make a Claim, and `assertClaimIntegrity` catches anything arriving from
//   an untyped boundary (JSON, DB row, another service).
//
// THE COVERAGE CONTRACT
//   value !== null  ⟹  coverage > 0 AND evidenceIds.length >= 1
//   Mirrored as a CHECK constraint on claim_snapshots, so it holds even if this file is
//   bypassed entirely.

export type Provenance = 'api' | 'document' | 'parsed' | 'user' | 'inferred';

export interface EvidenceRef {
  id: string;
  predicate: string;
  value: unknown;
  method: Provenance;
  confidence: number;
  observedAt: string;
  ttlDays: number;
  /** Calibrated parsers are trusted more than ones written from documentation. */
  parserVersion?: string | null;
}

export interface Assumption {
  what: string;
  source: Provenance;
  /** Plain-language consequence if this assumption is wrong. Drives the memo. */
  impactIfWrong?: string;
}

export interface Contradiction {
  predicate: string;
  values: { value: unknown; evidenceId: string; source: string }[];
  /** Spread between the extremes, where the values are numeric. */
  divergence?: number;
}

export interface Claim<T = unknown> {
  predicate: string;
  /** null means "we do not know" — never a neutral stand-in for missing data. */
  value: T | null;
  unit?: string;
  /** 0..1. Null-valued claims carry 0 — there is nothing to be confident about. */
  confidence: number;
  /** 0..1 — fraction of the evidence this claim ideally wants that is actually present. */
  coverage: number;
  evidenceIds: string[];
  assumptions: Assumption[];
  contradictions: Contradiction[];
  /** Versioned so a past decision can be replayed exactly. e.g. 'demand@2.1.0' */
  derivedBy: string;
  staleAt: string | null;
  /** Present only on unknown claims: why, and what would resolve it. */
  unknownReason?: string;
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

/**
 * Standalone reliability of an observation, before freshness or corroboration.
 *
 * An uncalibrated parser is deliberately scored barely above a user's guess: the six
 * ported adapters are stamped `0.2.0-uncalibrated`, meaning their selectors were written
 * from documentation and never verified against a real page. Treating their output as
 * near-fact is exactly the mistake that put 505 fabricated rows in the database.
 */
export const METHOD_BASE_CONFIDENCE: Record<Provenance, number> = {
  api: 0.95,
  document: 0.9,
  parsed: 0.8, // calibrated parser
  user: 0.4,
  inferred: 0.3,
};

const UNCALIBRATED_PARSED_CONFIDENCE = 0.5;

export function baseConfidence(e: EvidenceRef): number {
  if (e.method === 'parsed' && e.parserVersion && /uncalibrated/i.test(e.parserVersion)) {
    return UNCALIBRATED_PARSED_CONFIDENCE;
  }
  return METHOD_BASE_CONFIDENCE[e.method];
}

/**
 * Linear decay to 0.5 at TTL, then a 0.2 floor.
 *
 * Never zero: a stale price is weak evidence, not an absence of evidence. Dropping it to
 * zero would flip a claim to "unknown" purely because time passed, discarding the only
 * information we have.
 */
export function freshnessFactor(observedAt: string, ttlDays: number, now = Date.now()): number {
  const ageDays = (now - new Date(observedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(ageDays) || ageDays <= 0) return 1;
  if (ageDays >= ttlDays) return Math.max(0.2, 0.5 - (ageDays - ttlDays) / (ttlDays * 4));
  return 1 - 0.5 * (ageDays / ttlDays);
}

/** More independent sources agreeing is the strongest signal available. */
export function agreementFactor(distinctSources: number, hasContradiction: boolean): number {
  if (hasContradiction) return 0.6;
  if (distinctSources >= 3) return 1.2;
  if (distinctSources === 2) return 1.1;
  return 1.0;
}

/** One supplier is an anecdote. */
export function sampleAdequacy(n: number): number {
  if (n >= 10) return 1.0;
  if (n >= 3) return 0.8;
  if (n === 2) return 0.65;
  if (n === 1) return 0.5;
  return 0;
}

// ---------------------------------------------------------------------------
// Contradiction detection
// ---------------------------------------------------------------------------

/**
 * Two sources disagreeing is a FINDING, never something to average.
 *
 * If Keepa reports ₹599 and the live SERP reports ₹899, the mean (₹749) is a number
 * describing nothing. Averaging contradictory evidence is how an intelligence system
 * becomes confidently wrong — the same failure class as delivering t-shirt suppliers
 * for a yoga-mat query, one layer up.
 */
export const CONTRADICTION_DIVERGENCE_THRESHOLD = 0.25;

export function detectContradiction(
  predicate: string,
  evidence: EvidenceRef[],
): Contradiction | null {
  const numeric = evidence
    .map((e) => ({ e, n: typeof e.value === 'number' ? e.value : Number(e.value) }))
    .filter((x) => Number.isFinite(x.n) && x.n > 0);

  if (numeric.length < 2) return null;

  const values = numeric.map((x) => x.n);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const divergence = (max - min) / max;

  if (divergence < CONTRADICTION_DIVERGENCE_THRESHOLD) return null;

  return {
    predicate,
    divergence: Number(divergence.toFixed(3)),
    values: numeric.map((x) => ({
      value: x.n,
      evidenceId: x.e.id,
      source: x.e.parserVersion ?? x.e.method,
    })),
  };
}

// ---------------------------------------------------------------------------
// Constructors — the only two ways to make a Claim
// ---------------------------------------------------------------------------

export class ClaimIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClaimIntegrityError';
  }
}

/**
 * A claim we genuinely cannot make.
 *
 * `unknownReason` is not decoration — it becomes an entry in the memo's
 * "Unknowns blocking decision" list, which is the most actionable thing the product
 * produces. An unknown without a reason is a dead end for the user.
 */
export function unknown<T>(
  predicate: string,
  derivedBy: string,
  unknownReason: string,
  assumptions: Assumption[] = [],
): Claim<T> {
  return {
    predicate,
    value: null,
    confidence: 0,
    coverage: 0,
    evidenceIds: [],
    assumptions,
    contradictions: [],
    derivedBy,
    staleAt: null,
    unknownReason,
  };
}

export interface KnownClaimInput<T> {
  predicate: string;
  value: T;
  unit?: string;
  evidence: EvidenceRef[];
  /** How many pieces of evidence this predicate ideally wants. Drives coverage. */
  expectedEvidenceCount: number;
  derivedBy: string;
  assumptions?: Assumption[];
  now?: number;
}

/**
 * A claim backed by evidence. Throws if constructed without any — the contract is not
 * advisory.
 */
export function known<T>(input: KnownClaimInput<T>): Claim<T> {
  const { predicate, value, unit, evidence, expectedEvidenceCount, derivedBy, now } = input;

  if (!evidence.length) {
    throw new ClaimIntegrityError(
      `Claim "${predicate}" asserts a value with no evidence. Use unknown() instead — ` +
        `a claim without evidence is exactly the neutral-default defect this model exists to prevent.`,
    );
  }
  if (value === null || value === undefined) {
    throw new ClaimIntegrityError(
      `Claim "${predicate}" was built with known() but carries no value. Use unknown().`,
    );
  }

  const live = evidence.filter((e) => e.confidence > 0);
  const contradiction = detectContradiction(predicate, live);
  const contradictions = contradiction ? [contradiction] : [];

  const distinctSources = new Set(live.map((e) => e.parserVersion ?? e.method)).size;

  // Confidence is the mean per-observation confidence, adjusted by corroboration and
  // sample size. Capped at 1 — corroboration can rescue weak evidence but must never
  // manufacture certainty beyond a single perfect source.
  //
  // The observation's OWN confidence wins over the generic method mapping. A source
  // knows its own reliability better than its transport does: Google Trends arrives over
  // an API but is an undocumented endpoint returning a sampled index, so it records
  // itself at 0.75 rather than the 0.95 `api` would otherwise imply. Ignoring the stored
  // value — as this did until a live probe surfaced it — silently overstated every
  // observation that had deliberately rated itself lower.
  const perEvidence = live.map(
    (e) =>
      (Number.isFinite(e.confidence) ? e.confidence : baseConfidence(e)) *
      freshnessFactor(e.observedAt, e.ttlDays, now),
  );
  const meanConfidence = perEvidence.reduce((a, b) => a + b, 0) / (perEvidence.length || 1);

  const confidence = Math.max(
    0,
    Math.min(
      1,
      meanConfidence *
        agreementFactor(distinctSources, contradictions.length > 0) *
        sampleAdequacy(live.length),
    ),
  );

  const coverage = Math.max(
    0,
    Math.min(1, expectedEvidenceCount > 0 ? live.length / expectedEvidenceCount : 1),
  );

  // Earliest expiry wins: a claim is only as fresh as its most perishable input.
  const staleAt = live.length
    ? new Date(
        Math.min(
          ...live.map((e) => new Date(e.observedAt).getTime() + e.ttlDays * 86_400_000),
        ),
      ).toISOString()
    : null;

  const claim: Claim<T> = {
    predicate,
    value,
    unit,
    confidence: Number(confidence.toFixed(4)),
    coverage: Number(coverage.toFixed(4)),
    evidenceIds: live.map((e) => e.id),
    assumptions: input.assumptions ?? [],
    contradictions,
    derivedBy,
    staleAt,
  };

  assertClaimIntegrity(claim);
  return claim;
}

/**
 * Guards the untyped boundaries — JSON payloads, DB rows, another service.
 *
 * The constructors above make an invalid claim unrepresentable in TypeScript, but
 * nothing stops a plain object shaped like a Claim arriving from outside. This is the
 * backstop, and it throws rather than repairing: a fabricated claim must never reach a
 * merchant deciding where to put ₹1,00,000.
 */
export function assertClaimIntegrity(claim: Claim<unknown>): void {
  if (claim.value !== null && claim.value !== undefined) {
    if (claim.coverage <= 0) {
      throw new ClaimIntegrityError(
        `Claim "${claim.predicate}" asserts a value with zero coverage.`,
      );
    }
    if (!claim.evidenceIds.length) {
      throw new ClaimIntegrityError(
        `Claim "${claim.predicate}" asserts a value citing no evidence.`,
      );
    }
  } else if (claim.confidence !== 0 || claim.coverage !== 0) {
    throw new ClaimIntegrityError(
      `Unknown claim "${claim.predicate}" must report zero confidence and coverage.`,
    );
  }
  if (claim.confidence < 0 || claim.confidence > 1) {
    throw new ClaimIntegrityError(`Claim "${claim.predicate}" confidence out of range.`);
  }
}

// ---------------------------------------------------------------------------
// Aggregate coverage
// ---------------------------------------------------------------------------

/**
 * Evidence coverage across a set of claims, weighted by how much each matters.
 *
 * This is the number that must sit beside every verdict. "BUY, confidence 91%,
 * coverage 96%" and "BUY, confidence 91%, coverage 27%" are completely different
 * statements, and V2 rendered them identically.
 */
export function aggregateCoverage(
  claims: { claim: Claim<unknown>; weight: number }[],
): { coverage: number; missing: string[] } {
  const totalWeight = claims.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return { coverage: 0, missing: [] };

  const covered = claims.reduce((sum, c) => sum + c.weight * c.claim.coverage, 0);
  const missing = claims
    .filter((c) => c.claim.value === null)
    .sort((a, b) => b.weight - a.weight)
    .map((c) => c.claim.predicate);

  return { coverage: Number((covered / totalWeight).toFixed(4)), missing };
}
