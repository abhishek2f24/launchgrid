// Manufacturer-confidence score — PRD §12.
// A platform badge ("Verified Supplier" etc.) alone must never produce a
// "verified manufacturer" classification — it is not scored here at all;
// only concrete evidence signals are.

export interface ManufacturerSignals {
  businessLicenceSupportsManufacturing?: boolean; // +15
  factoryAuditAvailable?: boolean; // +15
  factoryAddressVerified?: boolean; // +10
  productionLineEvidence?: boolean; // +10
  productSpecificManufacturingCapability?: boolean; // +10
  customMaterialOrFormulaAvailable?: boolean; // +8
  batchTestingAvailable?: boolean; // +8
  exportHistory?: boolean; // +5
  consistentCatalogue?: boolean; // +5
  transparentProductionCapacity?: boolean; // +5

  veryBroadUnrelatedCatalogue?: boolean; // -10
  identicalPhotosUsedByManySellers?: boolean; // -8
  factoryLocationNotDisclosed?: boolean; // -12
  refusesAuditOrLiveVideo?: boolean; // -15
  cannotExplainProductSpecifications?: boolean; // -10
  companyScopeAppearsTradingOnly?: boolean; // -15
  unrealisticallyLowPrice?: boolean; // -10
  conflictingCompanyNames?: boolean; // -15
}

export type ManufacturerConfidenceLabel =
  | 'Verified manufacturer'
  | 'Likely manufacturer'
  | 'Mixed manufacturer/trader'
  | 'Likely trader'
  | 'Insufficient evidence';

export interface ManufacturerConfidenceResult {
  score: number; // 0-100
  label: ManufacturerConfidenceLabel;
  breakdown: { signal: string; weight: number; triggered: boolean }[];
  evidenceCount: number;
}

const POSITIVE_WEIGHTS: Record<string, number> = {
  businessLicenceSupportsManufacturing: 15,
  factoryAuditAvailable: 15,
  factoryAddressVerified: 10,
  productionLineEvidence: 10,
  productSpecificManufacturingCapability: 10,
  customMaterialOrFormulaAvailable: 8,
  batchTestingAvailable: 8,
  exportHistory: 5,
  consistentCatalogue: 5,
  transparentProductionCapacity: 5,
};

const NEGATIVE_WEIGHTS: Record<string, number> = {
  veryBroadUnrelatedCatalogue: -10,
  identicalPhotosUsedByManySellers: -8,
  factoryLocationNotDisclosed: -12,
  refusesAuditOrLiveVideo: -15,
  cannotExplainProductSpecifications: -10,
  companyScopeAppearsTradingOnly: -15,
  unrealisticallyLowPrice: -10,
  conflictingCompanyNames: -15,
};

export function calculateManufacturerConfidence(
  signals: ManufacturerSignals,
): ManufacturerConfidenceResult {
  const breakdown: { signal: string; weight: number; triggered: boolean }[] = [];
  let score = 50; // neutral baseline until evidence shifts it
  let evidenceCount = 0;

  for (const [key, weight] of Object.entries({ ...POSITIVE_WEIGHTS, ...NEGATIVE_WEIGHTS })) {
    const triggered = Boolean((signals as Record<string, boolean | undefined>)[key]);
    if (triggered) {
      score += weight;
      evidenceCount += 1;
    }
    breakdown.push({ signal: key, weight, triggered });
  }

  score = Math.max(0, Math.min(100, score));

  let label: ManufacturerConfidenceLabel;
  if (evidenceCount === 0) {
    label = 'Insufficient evidence';
  } else if (score >= 80) {
    label = 'Verified manufacturer';
  } else if (score >= 60) {
    label = 'Likely manufacturer';
  } else if (score >= 40) {
    label = 'Mixed manufacturer/trader';
  } else {
    label = 'Likely trader';
  }

  return { score, label, breakdown, evidenceCount };
}
