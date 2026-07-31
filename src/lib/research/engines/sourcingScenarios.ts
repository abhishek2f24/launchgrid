// Sourcing-route decision scenarios — answers "how should I actually source
// and test this" rather than just "what if price changes" (that's the
// existing conservative/expected/optimistic profitability scenarios).
// Deterministic: built entirely from real landed-cost/profitability engine
// outputs already computed elsewhere, never from invented numbers.

export type SourcingRisk = 'Low' | 'Medium' | 'High';
export type SourcingRoute = 'Domestic validation' | 'China pilot' | 'China scale';

export interface SourcingScenario {
  route: SourcingRoute;
  supplierName: string | null;
  quantity: number;
  unitPriceForeign: number | null;
  currency: string;
  packagingCost: number;
  freightCost: number;
  dutyAndImportCost: number;
  testingComplianceCost: number;
  readyToSellCostPerUnit: number;
  totalCashRequired: number;
  contributionPerUnit: number | null;
  contributionMarginPct: number | null;
  breakEvenUnits: number | null;
  inventoryExposureUnits: number;
  estimatedMonthsOfStock: number | null;
  risk: SourcingRisk;
  criticalMissingInputs: string[];
  recommendedUse: string;
}

export interface SourcingVerdict {
  recommendedRoute: SourcingRoute;
  reason: string;
}

const RECOMMENDED_USE: Record<SourcingRoute, string> = {
  'Domestic validation': 'First test',
  'China pilot': 'Proven concept',
  'China scale': 'Scaling',
};

export function recommendedUseFor(route: SourcingRoute): string {
  return RECOMMENDED_USE[route];
}

// Growth-optimized: recommends whichever modeled route has the best
// contribution economics, full stop. No compliance/quality/risk-tier gate
// forces a "safer" route to win over a more profitable one — that's a
// deliberate product-policy choice, not an oversight. Compliance and
// quality status still surface on the readiness matrix and blockers list
// elsewhere in the report; they're informational context for this pick,
// never an override of it.
export function pickSourcingVerdict(scenarios: SourcingScenario[]): SourcingVerdict {
  const viable = scenarios.filter((s) => s.contributionPerUnit != null);
  if (viable.length === 0) {
    return { recommendedRoute: scenarios[0].route, reason: 'Not enough cost/price data yet to compare routes on contribution — add price tiers for more suppliers.' };
  }

  const best = viable.reduce((a, b) => ((b.contributionPerUnit as number) > (a.contributionPerUnit as number) ? b : a));
  const marginPct = best.contributionMarginPct != null ? `${(best.contributionMarginPct * 100).toFixed(1)}%` : 'unknown';
  return {
    recommendedRoute: best.route,
    reason: `Highest contribution margin (${marginPct}) among modeled routes at ${best.quantity.toLocaleString()} units — picked for growth potential, not lowest risk. Check the readiness matrix for any open compliance/quality flags before committing capital.`,
  };
}
