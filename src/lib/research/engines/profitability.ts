// Marketplace profitability engine — PRD §15.

export type ScenarioType = 'conservative' | 'expected' | 'optimistic';

export interface MarketplaceFeeProfile {
  channel: string;
  commissionPct: number; // marketplace commission, fraction of selling price
  fixedFee?: number; // INR
  collectionFeePct?: number; // payment/collection fee, fraction of selling price
  fulfilmentPerUnit?: number; // shipping/fulfilment, INR
  packagingPerUnit?: number; // INR
  advertisingAllowancePct?: number; // fraction of selling price
  returnAllowancePct?: number; // fraction of selling price
  damageAllowancePct?: number; // fraction of selling price
  taxPct?: number; // fraction of selling price (e.g. TCS/TDS-equivalent net effect)
}

export interface ProfitabilityInputs {
  listingPrice: number;
  discountedPrice?: number;
  readyToSellCostPerUnit: number;
  fees: MarketplaceFeeProfile;
  scenarioType?: ScenarioType;
  initialInventorySpend?: number; // total cash tied up, for payback period
  monthlyUnitsSold?: number; // for inventory payback period
}

export interface FeeBreakdown {
  commission: number;
  collectionFee: number;
  fixedFee: number;
  fulfilment: number;
  packaging: number;
  advertising: number;
  returns: number;
  damage: number;
  tax: number;
  totalFees: number;
}

export interface ProfitabilityOutputs {
  sellingPrice: number;
  netSettlement: number;
  contributionPerOrder: number;
  contributionMarginPct: number;
  breakEvenUnits: number | null;
  returnOnInventoryPct: number | null;
  inventoryPaybackMonths: number | null;
  scenarioType: ScenarioType;
  feeBreakdown: FeeBreakdown;
  readyToSellCostPerUnit: number;
}

const SCENARIO_ADJUSTMENT: Record<ScenarioType, { priceMult: number; returnMult: number; adSpendMult: number }> = {
  conservative: { priceMult: 0.92, returnMult: 1.3, adSpendMult: 1.3 },
  expected: { priceMult: 1.0, returnMult: 1.0, adSpendMult: 1.0 },
  optimistic: { priceMult: 1.05, returnMult: 0.7, adSpendMult: 0.8 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateProfitability(inputs: ProfitabilityInputs): ProfitabilityOutputs {
  const scenarioType = inputs.scenarioType ?? 'expected';
  const adj = SCENARIO_ADJUSTMENT[scenarioType];

  const basePrice = inputs.discountedPrice ?? inputs.listingPrice;
  const sellingPrice = round2(basePrice * adj.priceMult);

  const f = inputs.fees;
  const commission = sellingPrice * f.commissionPct;
  const collectionFee = sellingPrice * (f.collectionFeePct ?? 0);
  const advertising = sellingPrice * (f.advertisingAllowancePct ?? 0) * adj.adSpendMult;
  const returns = sellingPrice * (f.returnAllowancePct ?? 0) * adj.returnMult;
  const damage = sellingPrice * (f.damageAllowancePct ?? 0);
  const tax = sellingPrice * (f.taxPct ?? 0);
  const fixedFee = f.fixedFee ?? 0;
  const fulfilment = f.fulfilmentPerUnit ?? 0;
  const packaging = f.packagingPerUnit ?? 0;

  const totalFees = commission + collectionFee + fixedFee + fulfilment + packaging + advertising + returns + damage + tax;
  const netSettlement = sellingPrice - totalFees;
  const contributionPerOrder = netSettlement - inputs.readyToSellCostPerUnit;
  const contributionMarginPct = sellingPrice > 0 ? contributionPerOrder / sellingPrice : 0;

  const breakEvenUnits =
    contributionPerOrder > 0 && inputs.initialInventorySpend
      ? Math.ceil(inputs.initialInventorySpend / contributionPerOrder)
      : null;

  const returnOnInventoryPct =
    inputs.initialInventorySpend && inputs.monthlyUnitsSold
      ? round2(
          ((contributionPerOrder * inputs.monthlyUnitsSold) / inputs.initialInventorySpend) * 100,
        )
      : null;

  const inventoryPaybackMonths =
    inputs.initialInventorySpend && inputs.monthlyUnitsSold && contributionPerOrder > 0
      ? round2(inputs.initialInventorySpend / (contributionPerOrder * inputs.monthlyUnitsSold))
      : null;

  return {
    sellingPrice,
    netSettlement: round2(netSettlement),
    contributionPerOrder: round2(contributionPerOrder),
    contributionMarginPct: round2(contributionMarginPct * 100) / 100,
    breakEvenUnits,
    returnOnInventoryPct,
    inventoryPaybackMonths,
    scenarioType,
    readyToSellCostPerUnit: inputs.readyToSellCostPerUnit,
    feeBreakdown: {
      commission: round2(commission),
      collectionFee: round2(collectionFee),
      fixedFee: round2(fixedFee),
      fulfilment: round2(fulfilment),
      packaging: round2(packaging),
      advertising: round2(advertising),
      returns: round2(returns),
      damage: round2(damage),
      tax: round2(tax),
      totalFees: round2(totalFees),
    },
  };
}

export function calculateAllScenarios(
  inputs: Omit<ProfitabilityInputs, 'scenarioType'>,
): Record<ScenarioType, ProfitabilityOutputs> {
  return {
    conservative: calculateProfitability({ ...inputs, scenarioType: 'conservative' }),
    expected: calculateProfitability({ ...inputs, scenarioType: 'expected' }),
    optimistic: calculateProfitability({ ...inputs, scenarioType: 'optimistic' }),
  };
}

// Sensible starting defaults; the doc requires these be editable, so this is
// just a seed table, not a source of truth — callers persist/override it.
export const DEFAULT_FEE_PROFILES: Record<string, MarketplaceFeeProfile> = {
  amazon_in: {
    channel: 'amazon_in',
    commissionPct: 0.15,
    fixedFee: 15,
    collectionFeePct: 0.02,
    fulfilmentPerUnit: 55,
    advertisingAllowancePct: 0.08,
    returnAllowancePct: 0.03,
    damageAllowancePct: 0.01,
  },
  flipkart: {
    channel: 'flipkart',
    commissionPct: 0.14,
    fixedFee: 10,
    collectionFeePct: 0.02,
    fulfilmentPerUnit: 50,
    advertisingAllowancePct: 0.07,
    returnAllowancePct: 0.03,
    damageAllowancePct: 0.01,
  },
  meesho: {
    channel: 'meesho',
    commissionPct: 0.06,
    fixedFee: 0,
    collectionFeePct: 0.02,
    fulfilmentPerUnit: 45,
    advertisingAllowancePct: 0.03,
    returnAllowancePct: 0.06,
    damageAllowancePct: 0.01,
  },
  own_website: {
    channel: 'own_website',
    commissionPct: 0,
    fixedFee: 0,
    collectionFeePct: 0.02,
    fulfilmentPerUnit: 60,
    advertisingAllowancePct: 0.12,
    returnAllowancePct: 0.02,
    damageAllowancePct: 0.01,
  },
};
