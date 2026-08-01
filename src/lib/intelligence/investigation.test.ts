// Investigation decision engine tests.
//
// Run with:  node --test src/lib/intelligence/investigation.test.ts
//
// These gates decide whether ₹20,000 leaves a bank account. They are the highest-stakes
// logic in the codebase.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { known, unknown, type Claim, type EvidenceRef } from './claim.ts';
import {
  evaluateInvestigation,
  computeFinancials,
  generateTasks,
  REQUIRED_PREDICATES,
  EVIDENCE_FLOOR,
} from './investigation.ts';

const ev = (value: unknown): EvidenceRef => ({
  id: `ev_${Math.random().toString(36).slice(2, 8)}`,
  predicate: 'x',
  value,
  method: 'user',
  confidence: 0.4,
  observedAt: new Date().toISOString(),
  ttlDays: 30,
});

/** A claim carrying a real value, as manual entry would produce. */
const c = (predicate: string, value: unknown): Claim<unknown> =>
  known({
    predicate,
    value,
    evidence: [ev(value)],
    expectedEvidenceCount: 1,
    derivedBy: 'test@1',
  });

/** Every predicate answered, with healthy economics. */
function fullyInvestigated(over: Record<string, unknown> = {}): Record<string, Claim<unknown>> {
  const base: Record<string, unknown> = {
    trend_direction: { direction: 'stable', changePct: 0.02 },
    seasonality: { seasonal: false, peakMonths: [], peakRatio: 1.1 },
    est_monthly_sales: 620,
    amazon_price: 599,
    strong_competitors: 4,
    avg_reviews: 390,
    sponsored_listings: 3,
    listing_quality: 'average',
    moq: 100,
    unit_price: 150,
    lead_time_days: 18,
    oem_capable: true,
    factory_verified: true,
    retail_price: 599,
    marketplace_fee_pct: 0.15,
    duty_pct: 0.18,
    freight_per_unit: 20,
    top_complaints: ['adhesive weak'],
    differentiation_ideas: ['premium 3M adhesive'],
    ...over,
  };
  const out: Record<string, Claim<unknown>> = {};
  for (const [k, v] of Object.entries(base)) {
    out[k] = v === null ? unknown(k, 'test@1', 'not investigated') : c(k, v);
  }
  return out;
}

describe('financial model', () => {
  it('computes contribution from claims', () => {
    const f = computeFinancials(fullyInvestigated(), 20000);
    // landed = 150 + 0.18*150 + 20 = 197 ; fees = 0.15*599 = 89.85 ; contribution = 312.15
    assert.equal(f.landedCostPerUnit, 197);
    assert.equal(f.contributionPerUnit, 312.15);
    assert.equal(f.workingCapital, 19700);
    assert.ok(f.breakEvenUnits! > 0);
  });

  it('returns nulls — never defaults — when a required input is unknown', () => {
    const f = computeFinancials(fullyInvestigated({ unit_price: null }), 20000);
    assert.equal(f.contributionPerUnit, null);
    assert.equal(f.landedCostPerUnit, null);
    assert.ok(f.missing.includes('unit_price'));
  });

  it('does not invent a duty rate when duty is unknown', () => {
    // Absent optional inputs are zero-rated and surfaced, never substituted with a
    // "typical" figure — that is how a landed cost becomes precise and wrong.
    const withDuty = computeFinancials(fullyInvestigated(), 20000);
    const noDuty = computeFinancials(fullyInvestigated({ duty_pct: null }), 20000);
    assert.ok(noDuty.landedCostPerUnit! < withDuty.landedCostPerUnit!);
  });
});

describe('disqualifiers → REJECT', () => {
  it('rejects a product that loses money on every unit', () => {
    const v = evaluateInvestigation(fullyInvestigated({ unit_price: 600, retail_price: 599 }), 20000);
    assert.equal(v.verdict, 'REJECT');
    assert.ok(v.disqualifiers.join(' ').includes('Loses'));
  });

  it('rejects before computing anything else — no score to override it', () => {
    // The V2 failure: a strong-looking product with a −2381% margin shown as launch-ready.
    const v = evaluateInvestigation(
      fullyInvestigated({ unit_price: 5000, retail_price: 599, est_monthly_sales: 99999 }),
      20000,
    );
    assert.equal(v.verdict, 'REJECT');
  });
});

describe('evidence floor → WAIT', () => {
  it('refuses a BUY on an empty investigation', () => {
    const v = evaluateInvestigation({}, 20000);
    assert.equal(v.verdict, 'WAIT');
    assert.equal(v.evidenceCoverage, 0);
  });

  it('WAITs while a blocking question is open, however good the rest looks', () => {
    const v = evaluateInvestigation(fullyInvestigated({ est_monthly_sales: null }), 20000);
    assert.equal(v.verdict, 'WAIT');
    assert.ok(v.unknowns.some((u) => u.predicate === 'est_monthly_sales' && u.blocksBuy));
  });

  it('names what would turn it into a BUY', () => {
    const v = evaluateInvestigation(fullyInvestigated({ moq: null }), 20000);
    assert.equal(v.verdict, 'WAIT');
    assert.ok(v.wouldBecomeBuyIf);
    assert.match(v.wouldBecomeBuyIf!, /Minimum order quantity/);
  });

  it('reports coverage beside the verdict', () => {
    // "BUY at 27% coverage" and "BUY at 96%" must never render identically.
    const thin = evaluateInvestigation({ moq: c('moq', 100) }, 20000);
    const full = evaluateInvestigation(fullyInvestigated(), 20000);
    assert.ok(thin.evidenceCoverage < EVIDENCE_FLOOR);
    assert.ok(full.evidenceCoverage > thin.evidenceCoverage);
  });
});

describe('capital fit → WAIT', () => {
  it('WAITs when the first order exceeds the budget', () => {
    // MOQ 500 × landed 197 = ₹98,500 against a ₹20,000 budget.
    const v = evaluateInvestigation(fullyInvestigated({ moq: 500 }), 20000);
    assert.equal(v.verdict, 'WAIT');
    assert.ok(v.because.join(' ').includes('budget'));
  });

  it('suggests the order size that would fit', () => {
    const v = evaluateInvestigation(fullyInvestigated({ moq: 500 }), 20000);
    assert.match(v.wouldBecomeBuyIf!, /~101 units|MOQ drops/);
  });
});

describe('BUY', () => {
  it('reaches BUY only with full evidence, healthy economics and a fitting budget', () => {
    const v = evaluateInvestigation(fullyInvestigated(), 20000);
    assert.equal(v.verdict, 'BUY');
    assert.equal(v.disqualifiers.length, 0);
    assert.ok(v.evidenceCoverage >= EVIDENCE_FLOOR);
    assert.ok(v.because.join(' ').includes('Contribution margin'));
  });

  it('states what would flip it to a REJECT', () => {
    const v = evaluateInvestigation(fullyInvestigated(), 20000);
    assert.ok(v.wouldBecomeRejectIf);
  });

  it('contains no score anywhere in the output', () => {
    const v = evaluateInvestigation(fullyInvestigated(), 20000);
    const keys = Object.keys(v);
    assert.equal(keys.some((k) => /score|rating|index/i.test(k)), false);
  });
});

describe('tasks', () => {
  it('puts blocking questions first, then cheapest first', () => {
    const v = evaluateInvestigation({}, 20000);
    const tasks = generateTasks(v.unknowns);
    const firstNonBlocking = tasks.findIndex((t) => !t.blocksBuy);
    const lastBlocking = tasks.map((t) => t.blocksBuy).lastIndexOf(true);
    assert.ok(lastBlocking < firstNonBlocking, 'all blocking tasks precede non-blocking ones');
  });

  it('generates one task per unknown and nothing for what is known', () => {
    const v = evaluateInvestigation(fullyInvestigated({ moq: null, duty_pct: null }), 20000);
    const tasks = generateTasks(v.unknowns);
    assert.equal(tasks.length, 2);
    assert.deepEqual(tasks.map((t) => t.resolves).sort(), ['duty_pct', 'moq']);
  });

  it('recommends the RFQ — free, and it answers four questions at once', () => {
    const v = evaluateInvestigation({}, 20000);
    const tasks = generateTasks(v.unknowns);
    const rfq = tasks.find((t) => t.resolves === 'moq');
    assert.equal(rfq!.costInr, 0);
    assert.match(rfq!.action, /RFQ/);
  });

  it('every required predicate has a resolving action', () => {
    // An unknown with no next step is a dead end for the user.
    for (const spec of REQUIRED_PREDICATES) {
      assert.ok(spec.task.action.length > 10, `${spec.predicate} has no usable action`);
    }
  });
});

describe('contradictions are surfaced', () => {
  it('carries a disagreement up into the verdict', () => {
    const conflicted = known({
      predicate: 'amazon_price',
      value: 599,
      evidence: [
        { ...ev(599), parserVersion: 'manual' },
        { ...ev(1400), parserVersion: 'keepa' },
      ],
      expectedEvidenceCount: 2,
      derivedBy: 'test@1',
    });
    const v = evaluateInvestigation({ ...fullyInvestigated(), amazon_price: conflicted }, 20000);
    assert.equal(v.contradictions.length, 1);
    assert.match(v.contradictions[0].detail, /disagree/);
  });
});
