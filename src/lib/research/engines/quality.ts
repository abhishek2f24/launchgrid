// Quality score — PRD §13/§33. Category-aware in principle (component inputs
// come from a category-specific spec-completeness check upstream); the
// weighting formula itself is category-agnostic and lives here.

export interface QualityComponents {
  specificationCompletenessPct: number; // 0-1
  materialQualityScore: number; // 0-100
  constructionScore: number; // 0-100
  certificationTestScore: number; // 0-100
  reviewQualityScore: number; // 0-100
  defectComplaintRatePct: number; // 0-1, higher = worse
  sampleInspectionScore: number | null; // 0-100, null if no sample inspected yet
}

export interface QualityResult {
  score: number; // 0-100
  label: 'Preliminary quality score — not sample verified' | 'Sample-verified quality score';
  breakdown: { component: string; weight: number; input: number; contribution: number }[];
}

const WEIGHTS = {
  specificationCompleteness: 0.15,
  materialQuality: 0.2,
  construction: 0.15,
  certificationTest: 0.1,
  reviewQuality: 0.15,
  defectInverse: 0.1,
  sampleInspection: 0.15,
};

export function calculateQualityScore(components: QualityComponents): QualityResult {
  const specScore = components.specificationCompletenessPct * 100;
  const defectInverseScore = (1 - components.defectComplaintRatePct) * 100;
  const sampleAvailable = components.sampleInspectionScore != null;
  // Redistribute the sample-inspection weight proportionally across the
  // remaining components when no sample has been inspected yet, rather than
  // silently scoring it as zero.
  const sampleWeight = sampleAvailable ? WEIGHTS.sampleInspection : 0;
  const redistribution = sampleAvailable
    ? 0
    : WEIGHTS.sampleInspection / (1 - WEIGHTS.sampleInspection);

  const effectiveWeights = {
    specificationCompleteness: WEIGHTS.specificationCompleteness * (1 + redistribution),
    materialQuality: WEIGHTS.materialQuality * (1 + redistribution),
    construction: WEIGHTS.construction * (1 + redistribution),
    certificationTest: WEIGHTS.certificationTest * (1 + redistribution),
    reviewQuality: WEIGHTS.reviewQuality * (1 + redistribution),
    defectInverse: WEIGHTS.defectInverse * (1 + redistribution),
    sampleInspection: sampleWeight,
  };

  const breakdown = [
    { component: 'specificationCompleteness', weight: effectiveWeights.specificationCompleteness, input: specScore, contribution: effectiveWeights.specificationCompleteness * specScore },
    { component: 'materialQuality', weight: effectiveWeights.materialQuality, input: components.materialQualityScore, contribution: effectiveWeights.materialQuality * components.materialQualityScore },
    { component: 'construction', weight: effectiveWeights.construction, input: components.constructionScore, contribution: effectiveWeights.construction * components.constructionScore },
    { component: 'certificationTest', weight: effectiveWeights.certificationTest, input: components.certificationTestScore, contribution: effectiveWeights.certificationTest * components.certificationTestScore },
    { component: 'reviewQuality', weight: effectiveWeights.reviewQuality, input: components.reviewQualityScore, contribution: effectiveWeights.reviewQuality * components.reviewQualityScore },
    { component: 'defectInverse', weight: effectiveWeights.defectInverse, input: defectInverseScore, contribution: effectiveWeights.defectInverse * defectInverseScore },
    { component: 'sampleInspection', weight: effectiveWeights.sampleInspection, input: components.sampleInspectionScore ?? 0, contribution: effectiveWeights.sampleInspection * (components.sampleInspectionScore ?? 0) },
  ];

  const score = Math.round(breakdown.reduce((sum, b) => sum + b.contribution, 0) * 100) / 100;

  return {
    score: Math.max(0, Math.min(100, score)),
    label: sampleAvailable ? 'Sample-verified quality score' : 'Preliminary quality score — not sample verified',
    breakdown,
  };
}
