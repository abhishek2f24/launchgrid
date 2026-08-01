// The investigation decision engine.
//
// ONE PRODUCT. ONE DECISION. BUY / WAIT / REJECT.
//
// NO SCORES. This file contains no weights, no 0–100 rating, and no composite index —
// deliberately. The V2 audit found ~49% of the flagship score's weight had no data
// source, and the lesson was not "pick better weights", it was that a single number
// invites you to average away the thing you do not know. A gate cannot be averaged away.
//
// HOW A VERDICT IS REACHED
//   1. Disqualifiers  — any true → REJECT. No further evaluation, no score computed.
//   2. Evidence floor — below it → WAIT. We are not entitled to a BUY on thin evidence.
//   3. Capital fit    — does not fit the budget → WAIT.
//   4. Otherwise      → BUY.
//
// WAIT IS THE DEFAULT AND THAT IS CORRECT. On day one almost everything is a WAIT.
// The product is not the verdict — it is `unknowns` and `tasks`: what is missing and the
// cheapest way to find out.

import { type Claim, aggregateCoverage } from './claim.ts';

export type Verdict = 'BUY' | 'WAIT' | 'REJECT';

export type Section = 'market' | 'marketplace' | 'supplier' | 'financial' | 'customer';

export interface PredicateSpec {
  predicate: string;
  label: string;
  section: Section;
  /** Relative importance for coverage. Not a score weight — nothing is summed into a rating. */
  weight: number;
  /** A verdict of BUY is not available while this is unknown. */
  blocksBuy: boolean;
  unit?: string;
  /** Smallest action that resolves it. */
  task: { action: string; costInr: number; effort: string };
}

/**
 * Everything a ₹20,000 decision wants to know.
 *
 * `blocksBuy` marks the questions you cannot commit money without answering. They are
 * deliberately few — an investigation that blocks on everything never resolves — and
 * each one is something that has actually cost merchants money when guessed.
 */
export const REQUIRED_PREDICATES: PredicateSpec[] = [
  // ---- Market (auto: Google Trends) ----
  {
    predicate: 'trend_direction', label: 'Search trend direction', section: 'market',
    weight: 0.08, blocksBuy: false,
    task: { action: 'Run Google Trends for this product', costInr: 0, effort: 'automatic' },
  },
  {
    predicate: 'seasonality', label: 'Seasonality', section: 'market',
    weight: 0.05, blocksBuy: false,
    task: { action: 'Run Google Trends over 12 months', costInr: 0, effort: 'automatic' },
  },

  // ---- Marketplace (manual until paid APIs exist) ----
  {
    predicate: 'est_monthly_sales', label: 'Estimated monthly sales', section: 'marketplace',
    weight: 0.15, blocksBuy: true, unit: 'units_per_month',
    task: {
      action: 'Open Amazon.in, note the Best Sellers Rank of the top 3 listings and estimate monthly units',
      costInr: 0, effort: '20 min',
    },
  },
  {
    predicate: 'amazon_price', label: 'Selling price on Amazon', section: 'marketplace',
    weight: 0.12, blocksBuy: true, unit: 'INR',
    task: { action: 'Record the median price of the top 5 listings on Amazon.in', costInr: 0, effort: '10 min' },
  },
  {
    predicate: 'strong_competitors', label: 'Strong competitors', section: 'marketplace',
    weight: 0.08, blocksBuy: false, unit: 'count',
    task: { action: 'Count listings with 500+ reviews on page 1', costInr: 0, effort: '10 min' },
  },
  {
    predicate: 'avg_reviews', label: 'Average review count', section: 'marketplace',
    weight: 0.05, blocksBuy: false, unit: 'count',
    task: { action: 'Average the review counts of the top 5 listings', costInr: 0, effort: '10 min' },
  },
  {
    predicate: 'sponsored_listings', label: 'Sponsored listings on page 1', section: 'marketplace',
    weight: 0.05, blocksBuy: false, unit: 'count',
    task: { action: 'Count Sponsored labels on page 1 — a proxy for ad competition', costInr: 0, effort: '5 min' },
  },
  {
    predicate: 'listing_quality', label: 'Competitor listing quality', section: 'marketplace',
    weight: 0.04, blocksBuy: false,
    task: { action: 'Judge the top 3 listings: images, A+ content, title quality', costInr: 0, effort: '10 min' },
  },

  // ---- Supplier (from the existing pipeline) ----
  {
    predicate: 'moq', label: 'Minimum order quantity', section: 'supplier',
    weight: 0.12, blocksBuy: true, unit: 'units',
    task: { action: 'Send an RFQ to 3 suppliers — resolves MOQ, price ladder, lead time and OEM in one email', costInr: 0, effort: '30 min' },
  },
  {
    predicate: 'unit_price', label: 'Supplier unit price', section: 'supplier',
    weight: 0.12, blocksBuy: true, unit: 'INR',
    task: { action: 'Send an RFQ to 3 suppliers asking for a price ladder at 100 / 250 / 500 units', costInr: 0, effort: '30 min' },
  },
  {
    predicate: 'lead_time_days', label: 'Lead time', section: 'supplier',
    weight: 0.05, blocksBuy: false, unit: 'days',
    task: { action: 'Ask suppliers for production plus dispatch time', costInr: 0, effort: '30 min' },
  },
  {
    predicate: 'oem_capable', label: 'OEM / branding capability', section: 'supplier',
    weight: 0.04, blocksBuy: false,
    task: { action: 'Ask whether they will print your logo, and the extra cost', costInr: 0, effort: '30 min' },
  },
  {
    predicate: 'factory_verified', label: 'Manufacturer or trader', section: 'supplier',
    weight: 0.04, blocksBuy: false,
    task: { action: 'Ask for a factory video call — traders decline, manufacturers usually agree', costInr: 0, effort: '1 hour' },
  },

  // ---- Financial ----
  {
    predicate: 'retail_price', label: 'Your intended selling price', section: 'financial',
    weight: 0.12, blocksBuy: true, unit: 'INR',
    task: { action: 'Decide your price, informed by the marketplace median above', costInr: 0, effort: '5 min' },
  },
  {
    predicate: 'marketplace_fee_pct', label: 'Marketplace commission', section: 'financial',
    weight: 0.06, blocksBuy: false, unit: 'fraction',
    task: { action: "Look up Amazon's fee schedule for this exact category — it ranges 2%–17%", costInr: 0, effort: '15 min' },
  },
  {
    predicate: 'duty_pct', label: 'Customs duty', section: 'financial',
    weight: 0.06, blocksBuy: false, unit: 'fraction',
    task: { action: 'Confirm the HS code and duty rate with a customs broker', costInr: 0, effort: '1 day' },
  },
  {
    predicate: 'freight_per_unit', label: 'Freight per unit', section: 'financial',
    weight: 0.04, blocksBuy: false, unit: 'INR',
    task: { action: 'Get a freight quote for the MOQ carton volume', costInr: 0, effort: '1 day' },
  },

  // ---- Customer ----
  {
    predicate: 'top_complaints', label: 'What customers complain about', section: 'customer',
    weight: 0.08, blocksBuy: false,
    task: { action: 'Read 1- and 2-star reviews on the top 3 listings; note recurring complaints', costInr: 0, effort: '30 min' },
  },
  {
    predicate: 'differentiation_ideas', label: 'Differentiation opportunity', section: 'customer',
    weight: 0.05, blocksBuy: false,
    task: { action: 'Turn the top complaint into one concrete product change', costInr: 0, effort: '15 min' },
  },
];

export const SPEC_BY_PREDICATE = new Map(REQUIRED_PREDICATES.map((s) => [s.predicate, s]));

// ---------------------------------------------------------------------------
// Financial model
// ---------------------------------------------------------------------------

export interface FinancialModel {
  landedCostPerUnit: number | null;
  contributionPerUnit: number | null;
  contributionMarginPct: number | null;
  firstOrderUnits: number | null;
  workingCapital: number | null;
  breakEvenUnits: number | null;
  roiPct: number | null;
  /** Inputs that were missing, so the caller can say why a figure is absent. */
  missing: string[];
}

const num = (c: Claim<unknown> | undefined): number | null =>
  c && typeof c.value === 'number' ? c.value : null;

/**
 * Computes unit economics from claims.
 *
 * Every output is nullable and returns null when any input it needs is unknown. There is
 * deliberately no default duty, no assumed freight, no "typical" commission: substituting
 * one is how a landed cost becomes precise and wrong, and it is the specific mistake that
 * once turned a −2381% margin into a launch recommendation.
 */
export function computeFinancials(
  claims: Record<string, Claim<unknown>>,
  budgetInr: number,
): FinancialModel {
  const missing: string[] = [];
  const need = (p: string): number | null => {
    const v = num(claims[p]);
    if (v === null) missing.push(p);
    return v;
  };

  const unitPrice = need('unit_price');
  const retail = need('retail_price');
  const moq = need('moq');
  // Optional: absent means the component is zero-rated and flagged, not invented.
  const feePct = num(claims.marketplace_fee_pct);
  const dutyPct = num(claims.duty_pct);
  const freight = num(claims.freight_per_unit);

  if (unitPrice === null || retail === null) {
    return {
      landedCostPerUnit: null, contributionPerUnit: null, contributionMarginPct: null,
      firstOrderUnits: null, workingCapital: null, breakEvenUnits: null, roiPct: null,
      missing,
    };
  }

  const landed = unitPrice + (dutyPct ?? 0) * unitPrice + (freight ?? 0);
  const fees = (feePct ?? 0) * retail;
  const contribution = retail - landed - fees;
  const marginPct = retail > 0 ? contribution / retail : null;

  const firstOrderUnits = moq;
  const workingCapital = moq !== null ? moq * landed : null;
  // Break-even here is against the first order's own cost — the question a merchant with
  // ₹20,000 is actually asking is "how many must I sell to get my money back".
  const breakEven =
    contribution > 0 && workingCapital !== null ? Math.ceil(workingCapital / contribution) : null;
  const roiPct =
    workingCapital !== null && workingCapital > 0 && moq !== null
      ? (contribution * moq) / workingCapital
      : null;

  const round = (n: number | null, dp = 2) =>
    n === null || !Number.isFinite(n) ? null : Number(n.toFixed(dp));

  return {
    landedCostPerUnit: round(landed),
    contributionPerUnit: round(contribution),
    contributionMarginPct: round(marginPct, 4),
    firstOrderUnits,
    workingCapital: round(workingCapital),
    breakEvenUnits: breakEven,
    roiPct: round(roiPct, 4),
    missing,
  };
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export interface Unknown {
  predicate: string;
  label: string;
  section: Section;
  blocksBuy: boolean;
  reason: string;
  task: { action: string; costInr: number; effort: string };
}

export interface InvestigationVerdict {
  verdict: Verdict;
  /** Coverage is reported beside every verdict. A BUY at 27% and at 96% are not the same. */
  evidenceCoverage: number;
  disqualifiers: string[];
  because: string[];
  unknowns: Unknown[];
  contradictions: { predicate: string; detail: string }[];
  financials: FinancialModel;
  wouldBecomeBuyIf: string | null;
  wouldBecomeRejectIf: string | null;
}

/** Below this, a BUY is not available regardless of how good the known numbers look. */
export const EVIDENCE_FLOOR = 0.6;

export function evaluateInvestigation(
  claims: Record<string, Claim<unknown>>,
  budgetInr: number,
): InvestigationVerdict {
  const financials = computeFinancials(claims, budgetInr);

  // ---- unknowns ----
  const unknowns: Unknown[] = REQUIRED_PREDICATES.filter(
    (spec) => !claims[spec.predicate] || claims[spec.predicate].value === null,
  ).map((spec) => ({
    predicate: spec.predicate,
    label: spec.label,
    section: spec.section,
    blocksBuy: spec.blocksBuy,
    reason: claims[spec.predicate]?.unknownReason ?? 'Not yet investigated',
    task: spec.task,
  }));

  const coverageInput = REQUIRED_PREDICATES.map((spec) => ({
    claim:
      claims[spec.predicate] ??
      ({ predicate: spec.predicate, value: null, confidence: 0, coverage: 0, evidenceIds: [],
        assumptions: [], contradictions: [], derivedBy: 'none', staleAt: null } as Claim<unknown>),
    weight: spec.weight,
  }));
  const { coverage } = aggregateCoverage(coverageInput);

  const contradictions = Object.values(claims)
    .flatMap((c) => c.contradictions.map((x) => ({ predicate: c.predicate, contradiction: x })))
    .map(({ predicate, contradiction }) => ({
      predicate,
      detail: `Sources disagree by ${Math.round((contradiction.divergence ?? 0) * 100)}%: ${contradiction.values
        .map((v) => `${v.source} says ${String(v.value)}`)
        .join(' · ')}`,
    }));

  const because: string[] = [];

  // ---- 1. Disqualifiers → REJECT ----
  const disqualifiers: string[] = [];
  if (financials.contributionPerUnit !== null && financials.contributionPerUnit <= 0) {
    disqualifiers.push(
      `Loses ₹${Math.abs(financials.contributionPerUnit).toFixed(2)} on every unit sold at the intended price`,
    );
  }
  if (
    financials.landedCostPerUnit !== null &&
    typeof claims.retail_price?.value === 'number' &&
    financials.landedCostPerUnit >= (claims.retail_price.value as number)
  ) {
    disqualifiers.push('Landed cost is at or above the intended selling price');
  }

  if (disqualifiers.length) {
    return {
      verdict: 'REJECT', evidenceCoverage: coverage, disqualifiers,
      because: disqualifiers, unknowns, contradictions, financials,
      wouldBecomeBuyIf: null,
      wouldBecomeRejectIf: null,
    };
  }

  // ---- 2. Evidence floor → WAIT ----
  const blocking = unknowns.filter((u) => u.blocksBuy);
  const floorFailures: string[] = [];
  if (coverage < EVIDENCE_FLOOR) {
    floorFailures.push(
      `Evidence coverage ${Math.round(coverage * 100)}% is below the ${Math.round(EVIDENCE_FLOOR * 100)}% needed to commit money`,
    );
  }
  if (blocking.length) {
    floorFailures.push(`${blocking.length} question(s) must be answered first: ${blocking.map((b) => b.label).join(', ')}`);
  }

  // ---- 3. Capital fit → WAIT ----
  const capitalFailures: string[] = [];
  if (financials.workingCapital !== null && financials.workingCapital > budgetInr) {
    capitalFailures.push(
      `First order needs ₹${financials.workingCapital.toFixed(0)} but the budget is ₹${budgetInr.toFixed(0)}`,
    );
  }

  if (financials.contributionMarginPct !== null) {
    because.push(
      `Contribution margin ${(financials.contributionMarginPct * 100).toFixed(1)}% (₹${financials.contributionPerUnit} per unit)`,
    );
  }
  if (financials.breakEvenUnits !== null) {
    because.push(`Break-even at ${financials.breakEvenUnits} units sold`);
  }

  if (floorFailures.length || capitalFailures.length) {
    const blockers = [...floorFailures, ...capitalFailures];
    return {
      verdict: 'WAIT',
      evidenceCoverage: coverage,
      disqualifiers: [],
      because: [...because, ...blockers],
      unknowns,
      contradictions,
      financials,
      // The most useful sentence the product produces: it turns a refusal into a task list.
      wouldBecomeBuyIf: buildWouldBecomeBuyIf(blocking, coverage, capitalFailures, budgetInr, financials),
      wouldBecomeRejectIf: null,
    };
  }

  // ---- 4. BUY ----
  return {
    verdict: 'BUY',
    evidenceCoverage: coverage,
    disqualifiers: [],
    because,
    unknowns,
    contradictions,
    financials,
    wouldBecomeBuyIf: null,
    wouldBecomeRejectIf:
      financials.contributionPerUnit !== null
        ? `Contribution falls to zero — e.g. supplier price rises by ₹${financials.contributionPerUnit.toFixed(0)}/unit, or duty is materially higher than assumed`
        : null,
  };
}

function buildWouldBecomeBuyIf(
  blocking: Unknown[],
  coverage: number,
  capitalFailures: string[],
  budgetInr: number,
  financials: FinancialModel,
): string {
  const parts: string[] = [];
  if (blocking.length) parts.push(`you answer ${blocking.map((b) => b.label).join(', ')}`);
  if (coverage < EVIDENCE_FLOOR) parts.push(`evidence coverage reaches ${Math.round(EVIDENCE_FLOOR * 100)}%`);
  if (capitalFailures.length && financials.landedCostPerUnit) {
    const affordable = Math.floor(budgetInr / financials.landedCostPerUnit);
    parts.push(`the supplier accepts an order of ~${affordable} units (or MOQ drops to fit ₹${budgetInr.toFixed(0)})`);
  }
  return parts.length ? `This becomes a BUY if ${parts.join(', and ')}.` : 'This becomes a BUY once the open questions are closed.';
}

/**
 * The checklist. Cheapest-first, because the point is to resolve the most uncertainty for
 * the least money — an RFQ costs nothing and answers four questions, so it should
 * almost always come before a ₹4,000 sample order.
 */
export interface InvestigationTask {
  resolves: string;
  action: string;
  costInr: number;
  effort: string;
  blocksBuy: boolean;
}

export function generateTasks(unknowns: Unknown[]): InvestigationTask[] {
  return unknowns
    .slice()
    .sort((a, b) => {
      // Blocking questions first — nothing else can produce a BUY while one is open.
      if (a.blocksBuy !== b.blocksBuy) return a.blocksBuy ? -1 : 1;
      return a.task.costInr - b.task.costInr;
    })
    .map((u) => ({
      resolves: u.predicate,
      action: u.task.action,
      costInr: u.task.costInr,
      effort: u.task.effort,
      blocksBuy: u.blocksBuy,
    }));
}
