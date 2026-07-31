// Landed-cost engine — PRD §14.
// Computes ex-factory, FOB, CIF and fully landed/ready-to-sell cost per unit,
// at a given order quantity, in INR, from a set of typed cost inputs.

export type CostConfidence =
  | 'confirmed_quotation'
  | 'supplier_estimated'
  | 'system_estimated'
  | 'missing_inputs';

export interface LandedCostInputs {
  quantity: number;
  unitPriceForeign: number; // per-unit price at the given quantity, in supplierCurrency
  supplierCurrency: string; // e.g. 'USD', 'CNY'
  fxRateToInr: number; // 1 unit of supplierCurrency in INR
  fxBufferPct?: number; // currency-conversion buffer, e.g. 0.02

  packagingPerUnit?: number; // INR
  brandingPerUnit?: number; // INR
  toolingTotal?: number; // INR, amortised over quantity
  sampleCost?: number; // INR, one-off, not part of per-unit unless requested

  inlandSupplierTransportTotal?: number; // INR, amortised over quantity
  internationalFreightTotal?: number; // INR, amortised over quantity
  insurancePct?: number; // fraction of CIF value

  customsDutyPct?: number; // fraction of assessable value
  socialWelfareSurchargePct?: number; // fraction of duty
  importIgstPct?: number; // fraction of (assessable + duty + surcharge)
  customsBrokerPerUnit?: number;
  portHandlingPerUnit?: number;

  warehousingPerUnit?: number;
  domesticTransportPerUnit?: number;
  inspectionPerUnit?: number;
  testingPerUnit?: number;
  compliancePerUnit?: number;

  damageAllowancePct?: number; // fraction added for damage/loss
  rejectionAllowancePct?: number; // fraction added for QC rejection
  paymentProcessingPct?: number; // fraction of unit price
}

export interface CostBridgeLine {
  label: string;
  value: number;
}

export interface LandedCostOutputs {
  exFactoryCostPerUnit: number;
  fobCostPerUnit: number;
  cifCostPerUnit: number;
  landedCostPerUnit: number;
  readyToSellCostPerUnit: number;
  totalCashRequirement: number;
  confidence: CostConfidence;
  assumptionsUsed: string[];
  // Grouped, human-readable breakdown of how the factory price becomes the
  // final ready-to-sell cost — lines sum exactly to readyToSellCostPerUnit.
  costBridge: CostBridgeLine[];
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function calculateLandedCost(inputs: LandedCostInputs): LandedCostOutputs {
  const assumptions: string[] = [];
  const missingRequired = !inputs.unitPriceForeign || !inputs.fxRateToInr || !inputs.quantity;

  const qty = inputs.quantity || 1;
  const fxBuffer = inputs.fxBufferPct ?? 0;
  if (inputs.fxBufferPct == null) assumptions.push('fxBufferPct defaulted to 0');

  const unitPriceInr = inputs.unitPriceForeign * inputs.fxRateToInr * (1 + fxBuffer);

  const packaging = inputs.packagingPerUnit ?? 0;
  const branding = inputs.brandingPerUnit ?? 0;
  const toolingPerUnit = (inputs.toolingTotal ?? 0) / qty;

  const exFactoryCostPerUnit = unitPriceInr + packaging + branding + toolingPerUnit;

  const inlandTransportPerUnit = (inputs.inlandSupplierTransportTotal ?? 0) / qty;
  const fobCostPerUnit = exFactoryCostPerUnit + inlandTransportPerUnit;

  const freightPerUnit = (inputs.internationalFreightTotal ?? 0) / qty;
  const insurancePct = inputs.insurancePct ?? 0.005;
  if (inputs.insurancePct == null) assumptions.push('insurancePct defaulted to 0.5%');
  const preInsuranceCif = fobCostPerUnit + freightPerUnit;
  const insurancePerUnit = preInsuranceCif * insurancePct;
  const cifCostPerUnit = preInsuranceCif + insurancePerUnit;

  const dutyPct = inputs.customsDutyPct ?? 0;
  if (inputs.customsDutyPct == null) assumptions.push('customsDutyPct defaulted to 0 — confirm HS code duty');
  const dutyPerUnit = cifCostPerUnit * dutyPct;

  const surchargePct = inputs.socialWelfareSurchargePct ?? 0.1; // typical 10% of duty in India
  const surchargePerUnit = dutyPerUnit * surchargePct;

  const igstPct = inputs.importIgstPct ?? 0.18; // common GST slab, must be confirmed per HS code
  if (inputs.importIgstPct == null) assumptions.push('importIgstPct defaulted to 18% — confirm per HSN');
  const igstBase = cifCostPerUnit + dutyPerUnit + surchargePerUnit;
  const igstPerUnit = igstBase * igstPct;

  const brokerPerUnit = inputs.customsBrokerPerUnit ?? 0;
  const portHandlingPerUnit = inputs.portHandlingPerUnit ?? 0;

  const landedCostPerUnit =
    cifCostPerUnit + dutyPerUnit + surchargePerUnit + igstPerUnit + brokerPerUnit + portHandlingPerUnit;

  const warehousing = inputs.warehousingPerUnit ?? 0;
  const domesticTransport = inputs.domesticTransportPerUnit ?? 0;
  const inspection = inputs.inspectionPerUnit ?? 0;
  const testing = inputs.testingPerUnit ?? 0;
  const compliance = inputs.compliancePerUnit ?? 0;

  const damagePct = inputs.damageAllowancePct ?? 0.01;
  const rejectionPct = inputs.rejectionAllowancePct ?? 0.02;
  const paymentPct = inputs.paymentProcessingPct ?? 0;

  const preAllowance =
    landedCostPerUnit + warehousing + domesticTransport + inspection + testing + compliance;
  const allowances = preAllowance * (damagePct + rejectionPct);
  const paymentFee = unitPriceInr * paymentPct;

  const readyToSellCostPerUnit = preAllowance + allowances + paymentFee;

  const totalCashRequirement = readyToSellCostPerUnit * qty + (inputs.sampleCost ?? 0);

  let confidence: CostConfidence = 'system_estimated';
  if (missingRequired) confidence = 'missing_inputs';

  const costBridge: CostBridgeLine[] = [
    { label: 'Factory price', value: round2(unitPriceInr) },
    { label: 'Packaging & branding', value: round2(packaging + branding + toolingPerUnit) },
    { label: 'Freight & insurance', value: round2(inlandTransportPerUnit + freightPerUnit + insurancePerUnit) },
    { label: 'Duty & import costs', value: round2(dutyPerUnit + surchargePerUnit + igstPerUnit + brokerPerUnit + portHandlingPerUnit) },
    { label: 'Domestic transport & warehousing', value: round2(warehousing + domesticTransport) },
    { label: 'Testing & compliance', value: round2(inspection + testing + compliance) },
    { label: 'Damage & rejection allowance', value: round2(allowances) },
    ...(paymentFee > 0 ? [{ label: 'Payment processing fee', value: round2(paymentFee) }] : []),
  ];

  return {
    exFactoryCostPerUnit: round2(exFactoryCostPerUnit),
    fobCostPerUnit: round2(fobCostPerUnit),
    cifCostPerUnit: round2(cifCostPerUnit),
    landedCostPerUnit: round2(landedCostPerUnit),
    readyToSellCostPerUnit: round2(readyToSellCostPerUnit),
    totalCashRequirement: round2(totalCashRequirement),
    confidence,
    assumptionsUsed: assumptions,
    costBridge,
  };
}

export const STANDARD_QUANTITY_BREAKPOINTS = [100, 500, 1000, 5000, 10000];

export function landedCostAtBreakpoints(
  base: Omit<LandedCostInputs, 'quantity'>,
  breakpoints: number[] = STANDARD_QUANTITY_BREAKPOINTS,
): Record<number, LandedCostOutputs> {
  const result: Record<number, LandedCostOutputs> = {};
  for (const qty of breakpoints) {
    result[qty] = calculateLandedCost({ ...base, quantity: qty });
  }
  return result;
}
