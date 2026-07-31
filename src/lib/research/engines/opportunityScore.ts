// Opportunity scoring engine — PRD §16/§34.
// All sub-scores are 0-100 inputs the caller derives from the other engines
// and from market/demand data; this module only implements the deterministic
// weighted combination, penalty application, and recommendation banding.

export interface OpportunityComponents {
  marginScore: number; // 0-100, derived from contribution margin
  demandScore: number; // 0-100, from demand evidence (trends, search volume, review counts)
  competitionGapScore: number; // 0-100, higher = less crowded / bigger gap
  improvementOpportunityScore: number; // 0-100, from review complaint clusters
  qualityScore: number; // 0-100
  manufacturerConfidenceScore: number; // 0-100
  moqSuitabilityScore: number; // 0-100, higher = MOQ fits buyer's budget/appetite
  capitalScore: number; // 0-100, higher = lower capital requirement relative to budget
  returnRiskScore: number; // 0-100, higher = lower return risk
  complianceScore: number; // 0-100, higher = simpler compliance
  shippingSuitabilityScore: number; // 0-100, higher = better shipping economics
}

export interface OpportunityPenalties {
  highRegulatoryUncertainty?: boolean;
  fragility?: boolean;
  sizeOrFitDependency?: boolean;
  highVolumetricWeight?: boolean;
  patentTrademarkRisk?: boolean;
  strongBrandDomination?: boolean;
  extremelyLowMarketPrice?: boolean;
  highReturnFrequency?: boolean;
  seasonalDemand?: boolean;
  supplierDocumentInconsistency?: boolean;
  criticalComplianceOrSafetyFlag?: boolean; // hard override — forces Reject
  /** Hard override — a product that loses money on every unit is never launchable,
   *  no matter how strong demand or supplier confidence look. */
  negativeContributionMargin?: boolean;
}

export type RecommendationClass =
  | 'Strong launch candidate'
  | 'Order samples and validate'
  | 'Negotiate or monitor'
  | 'Weak opportunity'
  | 'Reject';

export interface OpportunityScoreResult {
  rawScore: number; // before penalties, 0-100
  finalScore: number; // after penalties, clamped 0-100
  recommendation: RecommendationClass;
  breakdown: { dimension: string; weight: number; input: number; contribution: number }[];
  penaltiesApplied: string[];
  scoreVersion: string;
}

export const OPPORTUNITY_WEIGHTS = {
  marginScore: 0.2,
  demandScore: 0.15,
  competitionGapScore: 0.12,
  improvementOpportunityScore: 0.12,
  qualityScore: 0.1,
  manufacturerConfidenceScore: 0.08,
  moqSuitabilityScore: 0.08,
  capitalScore: 0.05,
  returnRiskScore: 0.04,
  complianceScore: 0.03,
  shippingSuitabilityScore: 0.03,
} as const;

// Hard overrides (criticalComplianceOrSafetyFlag, negativeContributionMargin) are excluded
// here — they force a Reject outright rather than deducting points.
const PENALTY_POINTS: Record<keyof Omit<OpportunityPenalties, 'criticalComplianceOrSafetyFlag' | 'negativeContributionMargin'>, number> = {
  highRegulatoryUncertainty: 12,
  fragility: 6,
  sizeOrFitDependency: 6,
  highVolumetricWeight: 6,
  patentTrademarkRisk: 15,
  strongBrandDomination: 10,
  extremelyLowMarketPrice: 8,
  highReturnFrequency: 10,
  seasonalDemand: 5,
  supplierDocumentInconsistency: 12,
};

export const SCORE_VERSION = '1.0.0';

export function calculateOpportunityScore(
  components: OpportunityComponents,
  penalties: OpportunityPenalties = {},
): OpportunityScoreResult {
  // Every dimension is defined as a 0-100 score. Clamp defensively: an out-of-range input
  // (e.g. a stray 999 typed into a judgment field) would otherwise be multiplied by its
  // weight and silently push the total past the "Strong launch candidate" threshold.
  const clamp01to100 = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0);

  const breakdown = Object.entries(OPPORTUNITY_WEIGHTS).map(([dimension, weight]) => {
    const input = clamp01to100((components as unknown as Record<string, number>)[dimension]);
    return { dimension, weight, input, contribution: weight * input };
  });

  const rawScore = Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0) * 100) / 100;

  const penaltiesApplied: string[] = [];
  let penaltyTotal = 0;
  for (const [key, points] of Object.entries(PENALTY_POINTS)) {
    if (penalties[key as keyof typeof PENALTY_POINTS]) {
      penaltyTotal += points;
      penaltiesApplied.push(key);
    }
  }

  let finalScore = Math.max(0, Math.min(100, rawScore - penaltyTotal));

  let recommendation: RecommendationClass;
  if (penalties.criticalComplianceOrSafetyFlag) {
    // A high score must never override a critical compliance/safety flag — §16.
    recommendation = 'Reject';
    finalScore = Math.min(finalScore, 20);
    penaltiesApplied.push('criticalComplianceOrSafetyFlag (hard override → Reject)');
  } else if (penalties.negativeContributionMargin) {
    // Selling below ready-to-sell cost loses money on every unit — never a launch candidate.
    recommendation = 'Reject';
    finalScore = Math.min(finalScore, 20);
    penaltiesApplied.push('negativeContributionMargin (hard override → Reject)');
  } else if (finalScore >= 80) {
    recommendation = 'Strong launch candidate';
  } else if (finalScore >= 65) {
    recommendation = 'Order samples and validate';
  } else if (finalScore >= 50) {
    recommendation = 'Negotiate or monitor';
  } else if (finalScore >= 35) {
    recommendation = 'Weak opportunity';
  } else {
    recommendation = 'Reject';
  }

  return { rawScore, finalScore, recommendation, breakdown, penaltiesApplied, scoreVersion: SCORE_VERSION };
}
