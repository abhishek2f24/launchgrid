// Converts review complaints and collected market listings into an actual
// manufacturable specification — the step that turns "here is what's wrong
// with the market" into "here is what to tell the supplier to build."
//
// Every row is honest about what it's based on. Attributes this system does
// not structurally collect (wipe dimensions, GSM, closure type, fragrance,
// liquid loading — none of which have a data-collection path yet) are
// explicitly marked `not_collected` rather than filled with an invented
// "market norm." Only pack size (derivable from real listing data) and the
// complaint-driven recommendations (derivable from real review text) are
// populated with real values.

export type SpecProvenance =
  | 'marketplace_observed'
  | 'ai_recommended'
  | 'supplier_confirmed'
  | 'sample_verified'
  | 'laboratory_verified'
  | 'not_collected';

export interface CurrentMarketAttribute {
  attribute: string;
  marketNorm: string;
  confidence: 'Low' | 'Medium' | 'High';
  provenance: SpecProvenance;
}

export interface MarketProblem {
  problem: string;
  mentionsRaw: string; // e.g. "2/10"
  mentionsPct: number;
  severity: string;
  sampleWarning: string | null;
}

export interface RecommendedAttribute {
  attribute: string;
  recommendedSpec: string;
  reason: string;
  provenance: SpecProvenance;
}

const COMPLAINT_TO_ATTRIBUTE: Record<string, { attribute: string; reasonPrefix: string }> = {
  smaller_than_shown: { attribute: 'Wipe dimensions', reasonPrefix: 'Addresses "too small" complaints' },
  material_too_thin: { attribute: 'Fabric GSM', reasonPrefix: 'Addresses thinness/tearing complaints' },
  wipes_tear_easily: { attribute: 'Fabric strength', reasonPrefix: 'Addresses tearing complaints' },
  dries_out_fast: { attribute: 'Liquid loading & closure', reasonPrefix: 'Addresses dry-out complaints' },
  fragrance_too_strong: { attribute: 'Fragrance', reasonPrefix: 'Addresses fragrance/irritation complaints' },
  skin_irritation: { attribute: 'Formulation & testing', reasonPrefix: 'Addresses skin-irritation complaints' },
  poor_packaging: { attribute: 'Packaging', reasonPrefix: 'Addresses damaged-packaging complaints' },
  weak_adhesive: { attribute: 'Closure adhesive', reasonPrefix: 'Addresses adhesive-failure complaints' },
};

export function buildCurrentMarketProduct(marketListings: { pack_size: number | null }[]): CurrentMarketAttribute[] {
  const packSizes = marketListings.map((l) => l.pack_size).filter((p): p is number => p != null);
  const packSizeMode = packSizes.length
    ? Object.entries(packSizes.reduce<Record<number, number>>((acc, p) => ({ ...acc, [p]: (acc[p] ?? 0) + 1 }), {})).sort(
        (a, b) => b[1] - a[1],
      )[0][0]
    : null;

  return [
    {
      attribute: 'Pack size',
      marketNorm: packSizeMode ? `${packSizeMode} wipes (most common across ${packSizes.length} listings)` : 'Not enough listings with pack size recorded',
      confidence: packSizes.length >= 10 ? 'High' : packSizes.length >= 3 ? 'Medium' : 'Low',
      provenance: 'marketplace_observed',
    },
    { attribute: 'Wipe dimensions', marketNorm: 'Not collected in current research', confidence: 'Low', provenance: 'not_collected' },
    { attribute: 'Fabric / GSM', marketNorm: 'Not collected in current research', confidence: 'Low', provenance: 'not_collected' },
    { attribute: 'Closure type', marketNorm: 'Not collected in current research', confidence: 'Low', provenance: 'not_collected' },
    { attribute: 'Fragrance', marketNorm: 'Not collected in current research', confidence: 'Low', provenance: 'not_collected' },
    { attribute: 'Liquid loading', marketNorm: 'Not collected in current research', confidence: 'Low', provenance: 'not_collected' },
  ];
}

export function buildMarketProblems(
  complaintClusters: { label: string; frequency: number; severity: string }[],
  totalReviewsAnalysed: number,
): MarketProblem[] {
  return complaintClusters.map((c) => ({
    problem: c.label,
    mentionsRaw: `${c.frequency}/${totalReviewsAnalysed}`,
    mentionsPct: totalReviewsAnalysed > 0 ? Math.round((c.frequency / totalReviewsAnalysed) * 100) : 0,
    severity: c.severity,
    sampleWarning: totalReviewsAnalysed < 20 ? `Low sample size (${totalReviewsAnalysed} reviews) — directional only` : null,
  }));
}

export function buildRecommendedProduct(
  complaintClusters: { complaint_key: string; label: string; suggested_spec_improvement: string | null }[],
): RecommendedAttribute[] {
  const fromComplaints: RecommendedAttribute[] = complaintClusters
    .filter((c) => c.suggested_spec_improvement)
    .map((c) => {
      const mapping = COMPLAINT_TO_ATTRIBUTE[c.complaint_key];
      return {
        attribute: mapping?.attribute ?? c.label,
        recommendedSpec: c.suggested_spec_improvement!,
        reason: `${mapping?.reasonPrefix ?? 'Addresses complaint'}: "${c.label}"`,
        provenance: 'ai_recommended' as const,
      };
    });

  // Category-invariant recommendations that don't depend on a specific
  // complaint being present — standard practice for a personal-care wipe
  // product, flagged as AI-recommended (best-practice), not evidence-derived.
  const standing: RecommendedAttribute[] = [
    {
      attribute: 'Testing',
      recommendedSpec: 'Microbial, stability and dermatological test reports',
      reason: 'Standard compliance requirement for personal-care wipe products, independent of specific complaints',
      provenance: 'ai_recommended',
    },
    {
      attribute: 'Claims',
      recommendedSpec: 'External cleansing only — avoid therapeutic/medical claims',
      reason: 'Reduces regulatory classification risk (cosmetic vs. drug)',
      provenance: 'ai_recommended',
    },
  ];

  return [...fromComplaints, ...standing];
}

export interface SupplierComplianceRow {
  requirement: string;
  bySupplier: Record<string, 'Yes' | 'No' | 'Unknown' | 'Negotiable'>;
}

export function buildSupplierComplianceMatrix(
  suppliers: {
    id: string;
    supplier_name: string;
    business_licence_available: number;
    audit_report_available: number;
    customisation_capability: number;
    moq: number | null;
    evidence: { evidence_type: string }[];
  }[],
  recommendedTestQty: number | null,
): { supplierNames: string[]; rows: SupplierComplianceRow[] } {
  const supplierNames = suppliers.map((s) => s.supplier_name);

  const moqRow: SupplierComplianceRow = {
    requirement: recommendedTestQty ? `MOQ ≤ ${recommendedTestQty} units` : 'MOQ suitable for a small first order',
    bySupplier: {},
  };
  const licenceRow: SupplierComplianceRow = { requirement: 'Business licence on file', bySupplier: {} };
  const auditRow: SupplierComplianceRow = { requirement: 'Factory audit evidence', bySupplier: {} };
  const customRow: SupplierComplianceRow = { requirement: 'Custom packaging/branding support', bySupplier: {} };
  const testReportRow: SupplierComplianceRow = { requirement: 'Product test report evidence', bySupplier: {} };
  const certRow: SupplierComplianceRow = { requirement: 'Certification evidence', bySupplier: {} };

  for (const s of suppliers) {
    if (recommendedTestQty != null && s.moq != null) {
      moqRow.bySupplier[s.supplier_name] = s.moq <= recommendedTestQty ? 'Yes' : s.moq <= recommendedTestQty * 4 ? 'Negotiable' : 'No';
    } else {
      moqRow.bySupplier[s.supplier_name] = 'Unknown';
    }
    licenceRow.bySupplier[s.supplier_name] = s.business_licence_available ? 'Yes' : 'No';
    auditRow.bySupplier[s.supplier_name] = s.audit_report_available ? 'Yes' : 'No';
    customRow.bySupplier[s.supplier_name] = s.customisation_capability ? 'Yes' : 'No';
    testReportRow.bySupplier[s.supplier_name] = s.evidence.some((e) => e.evidence_type === 'product_test_report') ? 'Yes' : 'No';
    certRow.bySupplier[s.supplier_name] = s.evidence.some((e) => e.evidence_type === 'certification') ? 'Yes' : 'No';
  }

  return { supplierNames, rows: [moqRow, licenceRow, auditRow, customRow, testReportRow, certRow] };
}
