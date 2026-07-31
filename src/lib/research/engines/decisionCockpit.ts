// Decision-cockpit engine — turns the opportunity-score breakdown into a
// verdict, a launch-readiness matrix, blockers, and a recommended first
// order quantity. Deterministic, built only from numbers the system already
// computed — no new fabricated metrics.

export type ReadinessStatus = 'green' | 'amber' | 'red';

export interface ReadinessDimension {
  key: string;
  label: string;
  status: ReadinessStatus;
  score: number;
  meaning: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  marginScore: 'Margin',
  demandScore: 'Demand',
  competitionGapScore: 'Competition',
  moqSuitabilityScore: 'MOQ',
  manufacturerConfidenceScore: 'Supplier',
  qualityScore: 'Quality',
  complianceScore: 'Compliance',
  improvementOpportunityScore: 'Differentiation',
};

// Human-readable renames for raw backend keys shown anywhere in the UI —
// §UI-fix: never expose camelCase backend variable names in production.
export const FRIENDLY_LABELS: Record<string, string> = {
  ...DIMENSION_LABELS,
  capitalScore: 'Capital requirement',
  returnRiskScore: 'Return risk',
  shippingSuitabilityScore: 'Shipping suitability',
  manufacturerConfidence: 'Manufacturer confidence',
  improvementOpportunity: 'Differentiation opportunity',
  highRegulatoryUncertainty: 'Import / compliance status unclear',
  fxBufferPct: 'Currency-conversion buffer',
  insurancePct: 'Shipping insurance rate',
  customsDutyPct: 'Customs duty rate',
  importIgstPct: 'Import GST rate',
  socialWelfareSurchargePct: 'Social welfare surcharge',
  damageAllowancePct: 'Damage allowance',
  rejectionAllowancePct: 'QC rejection allowance',
  fragility: 'Fragility risk',
  sizeOrFitDependency: 'Size/fit dependency risk',
  highVolumetricWeight: 'High shipping weight',
  patentTrademarkRisk: 'Patent/trademark risk',
  strongBrandDomination: 'Strong incumbent brands',
  extremelyLowMarketPrice: 'Market price too low to compete',
  highReturnFrequency: 'High return rate risk',
  seasonalDemand: 'Seasonal demand risk',
  supplierDocumentInconsistency: 'Supplier documentation inconsistent',
  criticalComplianceOrSafetyFlag: 'Critical compliance/safety issue',
  amazon_in: 'Amazon India',
  flipkart: 'Flipkart',
  meesho: 'Meesho',
  indiamart: 'IndiaMART',
  alibaba: 'Alibaba',
  yiwugo_1688: '1688',
  made_in_china: 'Made-in-China',
  tradeindia: 'TradeIndia',
  global_sources: 'Global Sources',
};

// Never expose a raw backend key in a UI, API response, or export without
// pairing it with its human label — callers should send {code, label}, not
// the code alone, so the frontend/export never has to re-derive naming.
export interface CodedLabel {
  code: string;
  label: string;
}

export function friendlyLabel(code: string): string {
  if (FRIENDLY_LABELS[code]) return FRIENDLY_LABELS[code];
  // Fallback: turn camelCase into Title Case words so an unmapped code is
  // still readable rather than raw, while FRIENDLY_LABELS stays the
  // authoritative source for anything worth a precise, non-literal phrasing.
  return code
    .replace(/Score$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function withLabel(code: string): CodedLabel {
  return { code, label: friendlyLabel(code) };
}

// Some free-text messages (e.g. the landed-cost engine's assumptionsUsed
// strings) embed a raw backend key inline — "fxBufferPct defaulted to 0" —
// rather than being a single code. This substitutes any known key found
// inside such a string with its friendly label, so the leak is fixed at
// the one place these messages are generated for display, not by trying
// to catch every future call site individually.
export function humanizeAssumptionText(text: string): string {
  let result = text;
  for (const [code, label] of Object.entries(FRIENDLY_LABELS)) {
    if (result.includes(code)) result = result.split(code).join(label);
  }
  return result;
}

const MEANING: Record<string, Record<ReadinessStatus, string>> = {
  marginScore: { green: 'Healthy expected unit economics', amber: 'Margin is workable but thin', red: 'Margin is too thin to be viable' },
  demandScore: { green: 'Strong demand evidence', amber: 'Limited listing data to confirm demand', red: 'No credible demand evidence yet' },
  competitionGapScore: { green: 'Clear gap versus competitors', amber: 'Price-sensitive, crowded category', red: 'Market is saturated with little room' },
  moqSuitabilityScore: { green: 'MOQ fits a safe first order', amber: 'MOQ is a bit high for a first test', red: 'MOQ is too high for first-order validation' },
  manufacturerConfidenceScore: { green: 'Manufacturer evidence is strong', amber: 'Mixed manufacturer/trader evidence', red: 'Supplier is likely a trader or unverified' },
  qualityScore: { green: 'Quality evidence is solid', amber: 'Not sample-verified yet', red: 'Quality evidence is weak or missing' },
  complianceScore: { green: 'Compliance path is straightforward', amber: 'Some compliance steps still unclear', red: 'Compliance/registration status uncertain' },
  improvementOpportunityScore: { green: 'Clear, defensible differentiation', amber: 'Improvement exists but is easy to copy', red: 'No meaningful differentiation identified' },
};

const BLOCKER_ACTIONS: Record<string, (ctx: BlockerContext) => string> = {
  moqSuitabilityScore: (ctx) =>
    `Negotiate MOQ down to roughly ${ctx.recommendedTestQty ?? 'a small pilot quantity'} units before ordering — the current MOQ of ${ctx.supplierMoq ?? 'the quoted amount'} creates too much exposure before demand is validated.`,
  complianceScore: () => 'Obtain the relevant compliance/registration documents (e.g. cosmetic/BIS/CDSCO as applicable) before placing a bulk order.',
  manufacturerConfidenceScore: () => 'Find or negotiate with a better-verified manufacturer — current evidence suggests a trader, not a factory.',
  qualityScore: () => 'Order a sample and get it independently tested before committing to a bulk order.',
  marginScore: () => 'Renegotiate unit price or find a lower-cost supplier — current margin does not clear a safe threshold.',
  demandScore: () => 'Collect more market listings/reviews before trusting the demand signal.',
  competitionGapScore: () => 'Reassess positioning — the category looks saturated or highly price-sensitive.',
  improvementOpportunityScore: () => 'Identify a stronger, harder-to-copy differentiator before launching.',
};

interface BlockerContext {
  recommendedTestQty: number | null;
  supplierMoq: number | null;
}

export interface Blocker {
  dimension: string;
  label: string;
  action: string;
}

const GREEN_MIN = 70;
const AMBER_MIN = 40;

function statusFor(score: number): ReadinessStatus {
  if (score >= GREEN_MIN) return 'green';
  if (score >= AMBER_MIN) return 'amber';
  return 'red';
}

const RISK_TO_STATUS: Record<'Low' | 'Medium' | 'High', ReadinessStatus> = { Low: 'green', Medium: 'amber', High: 'red' };

export function buildReadinessMatrix(
  breakdown: { dimension: string; input: number }[],
  penaltiesApplied: string[],
  moqInventoryRisk?: 'Low' | 'Medium' | 'High' | null,
): ReadinessDimension[] {
  const matrix: ReadinessDimension[] = [];
  for (const [key, label] of Object.entries(DIMENSION_LABELS)) {
    const entry = breakdown.find((b) => b.dimension === key);
    if (!entry) continue;
    let status = statusFor(entry.input);

    // MOQ suitability is otherwise a subjective, manually-entered score —
    // whenever the real MOQ-vs-safe-order-budget calculation is available,
    // it must win over that subjective input rather than silently disagree
    // with the "Recommended Order" section on the same report.
    if (key === 'moqSuitabilityScore' && moqInventoryRisk) {
      status = RISK_TO_STATUS[moqInventoryRisk];
    }

    // Hard penalty flags override the soft score for the dimension they
    // concretely relate to — a compliance flag should always show red, even
    // if the numeric complianceScore input was moderate.
    if (key === 'complianceScore' && penaltiesApplied.some((p) => p.includes('Regulatory') || p.includes('regulatory'))) {
      status = 'red';
    }
    if (key === 'manufacturerConfidenceScore' && penaltiesApplied.some((p) => p.includes('Document'))) {
      status = 'red';
    }
    if (key === 'improvementOpportunityScore' && penaltiesApplied.some((p) => p.includes('Trademark') || p.includes('trademark'))) {
      status = 'red';
    }

    matrix.push({ key, label, status, score: entry.input, meaning: MEANING[key]?.[status] ?? '' });
  }
  return matrix;
}

export function buildBlockers(matrix: ReadinessDimension[], ctx: BlockerContext): Blocker[] {
  return matrix
    .filter((m) => m.status === 'red')
    .map((m) => ({
      dimension: m.key,
      label: m.label,
      action: BLOCKER_ACTIONS[m.key]?.(ctx) ?? `Resolve the ${m.label.toLowerCase()} risk before ordering.`,
    }));
}

export interface RecommendedOrder {
  recommendedTestQty: number | null;
  supplierMoq: number | null;
  gapUnits: number | null;
  suggestedNegotiationTarget: number | null;
  maxSafeInvestment: number | null;
  estimatedInvestmentAtMoq: number | null;
  inventoryRisk: 'Low' | 'Medium' | 'High' | null;
}

const DEFAULT_PILOT_CEILING = 500;

export function computeRecommendedOrder(
  supplierMoq: number | null,
  maxInitialInvestment: number | null,
  readyToSellCostPerUnit: number | null,
): RecommendedOrder {
  if (!readyToSellCostPerUnit || readyToSellCostPerUnit <= 0) {
    return {
      recommendedTestQty: null,
      supplierMoq,
      gapUnits: null,
      suggestedNegotiationTarget: null,
      maxSafeInvestment: null,
      estimatedInvestmentAtMoq: null,
      inventoryRisk: null,
    };
  }

  const maxSafeUnits = maxInitialInvestment ? Math.floor(maxInitialInvestment / readyToSellCostPerUnit) : DEFAULT_PILOT_CEILING;
  const recommendedTestQty = Math.max(1, Math.min(supplierMoq ?? Infinity, maxSafeUnits, DEFAULT_PILOT_CEILING));
  const gapUnits = supplierMoq != null ? Math.max(0, supplierMoq - recommendedTestQty) : null;
  const suggestedNegotiationTarget =
    supplierMoq != null && supplierMoq > recommendedTestQty
      ? Math.min(supplierMoq, Math.ceil((recommendedTestQty * 1.5) / 100) * 100)
      : supplierMoq;
  const estimatedInvestmentAtMoq = supplierMoq != null ? Math.round(supplierMoq * readyToSellCostPerUnit * 100) / 100 : null;
  const maxSafeInvestment = Math.round(recommendedTestQty * readyToSellCostPerUnit * 100) / 100;
  const inventoryRisk: 'Low' | 'Medium' | 'High' | null =
    supplierMoq == null ? null : supplierMoq <= recommendedTestQty ? 'Low' : supplierMoq <= maxSafeUnits ? 'Medium' : 'High';

  return { recommendedTestQty, supplierMoq, gapUnits, suggestedNegotiationTarget, maxSafeInvestment, estimatedInvestmentAtMoq, inventoryRisk };
}

export type PrimaryDecision = 'Launch' | 'Sample First' | 'Negotiate' | 'Do not launch yet' | 'Reject';

const PRIMARY_DECISION_BY_RECOMMENDATION: Record<string, PrimaryDecision> = {
  'Strong launch candidate': 'Launch',
  'Order samples and validate': 'Sample First',
  'Negotiate or monitor': 'Negotiate',
  'Weak opportunity': 'Do not launch yet',
  Reject: 'Reject',
};

export interface Verdict {
  primaryDecision: PrimaryDecision;
  explanation: string;
}

export function buildVerdict(recommendation: string, blockers: Blocker[]): Verdict {
  let primaryDecision = PRIMARY_DECISION_BY_RECOMMENDATION[recommendation] ?? 'Negotiate';
  if (blockers.length > 0 && (primaryDecision === 'Launch' || primaryDecision === 'Sample First' || primaryDecision === 'Negotiate')) {
    primaryDecision = 'Do not launch yet';
  }

  let explanation: string;
  if (blockers.length === 0) {
    explanation =
      primaryDecision === 'Launch'
        ? 'No blockers found — economics and evidence support moving forward.'
        : primaryDecision === 'Reject'
          ? 'Overall opportunity is too weak to pursue right now.'
          : 'Order a sample and validate before committing to a bulk order.';
  } else {
    explanation = blockers.map((b) => b.action).join(' ');
  }

  return { primaryDecision, explanation };
}

export interface CompletenessInput {
  hasTargetRetailPrice: boolean;
  hasMaxInvestment: boolean;
  hasSupplierLeadTime: boolean;
  hasComplianceEvidence: boolean;
  hasDemandEstimate: boolean;
  hasConfirmedFeeProfile: boolean; // always false today — see report.ts note
  hasCartonDimensions: boolean; // always false today — schema doesn't track this yet
  marketListingCount: number;
  supplierCount: number;
  reviewCount: number;
}

export interface Completeness {
  percent: number;
  confidence: 'Low' | 'Medium' | 'High';
  missing: string[];
}

export function computeCompleteness(input: CompletenessInput): Completeness {
  const checks: { label: string; present: boolean }[] = [
    { label: 'Target retail price', present: input.hasTargetRetailPrice },
    { label: 'Maximum initial investment budget', present: input.hasMaxInvestment },
    { label: 'Supplier lead time', present: input.hasSupplierLeadTime },
    { label: 'Compliance / test report evidence', present: input.hasComplianceEvidence },
    { label: 'Estimated monthly demand', present: input.hasDemandEstimate },
    { label: 'Confirmed marketplace fee profile (defaults are being used)', present: input.hasConfirmedFeeProfile },
    { label: 'Carton dimensions and gross weight', present: input.hasCartonDimensions },
  ];

  const present = checks.filter((c) => c.present).length;
  const percent = Math.round((present / checks.length) * 100);
  const missing = checks.filter((c) => !c.present).map((c) => c.label);

  let confidence: 'Low' | 'Medium' | 'High' = 'Low';
  if (percent >= 75 && input.marketListingCount >= 10 && input.reviewCount >= 20) confidence = 'High';
  else if (percent >= 50 && input.marketListingCount >= 3) confidence = 'Medium';

  return { percent, confidence, missing };
}
