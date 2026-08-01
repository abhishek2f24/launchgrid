// Claim model tests.
//
// Run with:  node --test src/lib/intelligence/claim.test.ts
//
// The load-bearing tests here are the ones asserting that a claim CANNOT be fabricated.
// Everything else is arithmetic.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  known,
  unknown,
  assertClaimIntegrity,
  detectContradiction,
  aggregateCoverage,
  freshnessFactor,
  baseConfidence,
  sampleAdequacy,
  ClaimIntegrityError,
  type EvidenceRef,
} from './claim.ts';

const ev = (over: Partial<EvidenceRef> = {}): EvidenceRef => ({
  id: `ev_${Math.random().toString(36).slice(2, 8)}`,
  predicate: 'unit_price',
  value: 599,
  method: 'parsed',
  confidence: 0.8,
  observedAt: new Date().toISOString(),
  ttlDays: 30,
  parserVersion: 'indiamart-im-lc-card@1.0.0',
  ...over,
});

describe('the coverage contract', () => {
  it('REFUSES to build a valued claim with no evidence', () => {
    assert.throws(
      () =>
        known({
          predicate: 'demand',
          value: 78,
          evidence: [],
          expectedEvidenceCount: 3,
          derivedBy: 'demand@1.0.0',
        }),
      ClaimIntegrityError,
    );
  });

  it('is the V2 defect made impossible: no neutral-50 without evidence', () => {
    // In V2 this exact situation produced `marginScore = 50` and fed it into the
    // headline score as though it were a measurement.
    const claim = unknown<number>('marginScore', 'margin@1.0.0', 'No profitability run yet');
    assert.equal(claim.value, null);
    assert.equal(claim.coverage, 0);
    assert.equal(claim.confidence, 0);
    assert.deepEqual(claim.evidenceIds, []);
  });

  it('rejects a hand-built claim that asserts a value citing no evidence', () => {
    assert.throws(
      () =>
        assertClaimIntegrity({
          predicate: 'demand',
          value: 78,
          confidence: 0.9,
          coverage: 0.9,
          evidenceIds: [],
          assumptions: [],
          contradictions: [],
          derivedBy: 'hand@0',
          staleAt: null,
        }),
      ClaimIntegrityError,
    );
  });

  it('rejects an unknown claim pretending to be confident', () => {
    assert.throws(
      () =>
        assertClaimIntegrity({
          predicate: 'demand',
          value: null,
          confidence: 0.8,
          coverage: 0.5,
          evidenceIds: [],
          assumptions: [],
          contradictions: [],
          derivedBy: 'hand@0',
          staleAt: null,
        }),
      ClaimIntegrityError,
    );
  });

  it('builds a valid claim when evidence is present', () => {
    const c = known({
      predicate: 'unit_price',
      value: 599,
      unit: 'INR',
      evidence: [ev(), ev(), ev()],
      expectedEvidenceCount: 3,
      derivedBy: 'price@1.0.0',
    });
    assert.equal(c.value, 599);
    assert.equal(c.coverage, 1);
    assert.equal(c.evidenceIds.length, 3);
    assert.ok(c.confidence > 0);
  });

  it('reports partial coverage when evidence is thin', () => {
    const c = known({
      predicate: 'unit_price',
      value: 599,
      evidence: [ev()],
      expectedEvidenceCount: 4,
      derivedBy: 'price@1.0.0',
    });
    assert.equal(c.coverage, 0.25);
  });
});

describe('confidence', () => {
  it('trusts an API more than a user guess', () => {
    assert.ok(baseConfidence(ev({ method: 'api' })) > baseConfidence(ev({ method: 'user' })));
  });

  it('distrusts an uncalibrated parser almost as much as a user guess', () => {
    // The six ported adapters are stamped 0.2.0-uncalibrated: selectors written from
    // documentation, never checked against a live page.
    const cal = baseConfidence(ev({ parserVersion: 'indiamart-im-lc-card@1.0.0' }));
    const unc = baseConfidence(ev({ parserVersion: 'alibaba@0.2.0-uncalibrated' }));
    assert.ok(unc < cal);
    assert.ok(unc <= 0.5);
  });

  it('decays with age but never to zero', () => {
    const fresh = freshnessFactor(new Date().toISOString(), 30);
    const old = freshnessFactor(new Date(Date.now() - 60 * 86_400_000).toISOString(), 30);
    const ancient = freshnessFactor(new Date(Date.now() - 900 * 86_400_000).toISOString(), 30);
    assert.ok(fresh > old);
    assert.ok(old > ancient);
    assert.ok(ancient >= 0.2, 'stale evidence is weak, not absent');
  });

  it('penalises a single-source claim', () => {
    assert.ok(sampleAdequacy(1) < sampleAdequacy(3));
    assert.ok(sampleAdequacy(3) < sampleAdequacy(10));
    assert.equal(sampleAdequacy(0), 0);
  });

  it('rewards independent corroboration', () => {
    const one = known({
      predicate: 'unit_price', value: 599,
      evidence: [ev({ parserVersion: 'a' }), ev({ parserVersion: 'a' }), ev({ parserVersion: 'a' })],
      expectedEvidenceCount: 3, derivedBy: 'p@1',
    });
    const many = known({
      predicate: 'unit_price', value: 599,
      evidence: [ev({ parserVersion: 'a' }), ev({ parserVersion: 'b' }), ev({ parserVersion: 'c' })],
      expectedEvidenceCount: 3, derivedBy: 'p@1',
    });
    assert.ok(many.confidence > one.confidence);
  });

  it('never exceeds 1', () => {
    const c = known({
      predicate: 'unit_price', value: 599,
      evidence: Array.from({ length: 12 }, (_, i) => ev({ method: 'api', parserVersion: `src_${i}` })),
      expectedEvidenceCount: 3, derivedBy: 'p@1',
    });
    assert.ok(c.confidence <= 1);
  });
});

describe('contradictions', () => {
  it('surfaces disagreement rather than averaging it', () => {
    // Keepa says 599, the live SERP says 899. The mean (749) describes nothing.
    const c = known({
      predicate: 'median_price',
      value: 599,
      evidence: [
        ev({ value: 599, parserVersion: 'keepa' }),
        ev({ value: 899, parserVersion: 'serp' }),
      ],
      expectedEvidenceCount: 2,
      derivedBy: 'price@1.0.0',
    });
    assert.equal(c.contradictions.length, 1);
    assert.ok(c.contradictions[0].divergence! > 0.25);
  });

  it('lowers confidence when sources disagree', () => {
    const agree = known({
      predicate: 'median_price', value: 599,
      evidence: [ev({ value: 599, parserVersion: 'keepa' }), ev({ value: 605, parserVersion: 'serp' })],
      expectedEvidenceCount: 2, derivedBy: 'p@1',
    });
    const disagree = known({
      predicate: 'median_price', value: 599,
      evidence: [ev({ value: 599, parserVersion: 'keepa' }), ev({ value: 1400, parserVersion: 'serp' })],
      expectedEvidenceCount: 2, derivedBy: 'p@1',
    });
    assert.ok(disagree.confidence < agree.confidence);
  });

  it('tolerates ordinary variation', () => {
    assert.equal(detectContradiction('unit_price', [ev({ value: 100 }), ev({ value: 110 })]), null);
  });

  it('needs two numeric observations to find a contradiction', () => {
    assert.equal(detectContradiction('unit_price', [ev({ value: 100 })]), null);
  });
});

describe('aggregate coverage', () => {
  it('reports the number that must sit beside every verdict', () => {
    const priced = known({
      predicate: 'median_price', value: 599,
      evidence: [ev(), ev(), ev()], expectedEvidenceCount: 3, derivedBy: 'p@1',
    });
    const demand = unknown<number>('demand', 'demand@1', 'No marketplace data connected');

    const { coverage, missing } = aggregateCoverage([
      { claim: priced, weight: 0.2 },
      { claim: demand, weight: 0.15 },
    ]);

    // 0.2 fully covered, 0.15 not covered at all.
    assert.ok(coverage > 0.55 && coverage < 0.58);
    assert.deepEqual(missing, ['demand']);
  });

  it('lists the heaviest unknowns first — these become the memo blockers', () => {
    const { missing } = aggregateCoverage([
      { claim: unknown('compliance', 'c@1', 'no regulatory data'), weight: 0.03 },
      { claim: unknown('demand', 'd@1', 'no marketplace data'), weight: 0.15 },
      { claim: unknown('competition', 'x@1', 'no SERP data'), weight: 0.12 },
    ]);
    assert.deepEqual(missing, ['demand', 'competition', 'compliance']);
  });

  it('reports zero coverage for an all-unknown product rather than a comfortable default', () => {
    const { coverage } = aggregateCoverage([
      { claim: unknown('demand', 'd@1', 'none'), weight: 0.15 },
      { claim: unknown('margin', 'm@1', 'none'), weight: 0.2 },
    ]);
    assert.equal(coverage, 0);
  });
});

describe('observation confidence is respected', () => {
  it('uses the stored confidence, not just the transport method', () => {
    // Google Trends arrives over an API but is an undocumented endpoint returning a
    // sampled index, so it rates itself 0.75. Treating it as a 0.95 `api` observation
    // would overstate every demand claim built from it.
    const cautious = known({
      predicate: 'search_interest', value: 91,
      evidence: [ev({ method: 'api', confidence: 0.75, parserVersion: 'google-trends@1' })],
      expectedEvidenceCount: 1, derivedBy: 'trends@1',
    });
    const confident = known({
      predicate: 'search_interest', value: 91,
      evidence: [ev({ method: 'api', confidence: 0.95, parserVersion: 'keepa@1' })],
      expectedEvidenceCount: 1, derivedBy: 'keepa@1',
    });
    assert.ok(cautious.confidence < confident.confidence);
  });
});
