// Decision Confidence Engine — quantifies how fragile the opportunity-score
// verdict is, using the *same* deterministic scoring engine as the report
// itself (never an LLM-invented range). Every "what if" scenario is a real
// call to calculateOpportunityScore with specific component/penalty
// overrides — the low/high bounds and the per-contributor point swings are
// all reproducible from those calls, not hand-authored numbers.
import {
  calculateOpportunityScore,
  OpportunityComponents,
  OpportunityPenalties,
  RecommendationClass,
  SCORE_VERSION,
} from './opportunityScore';
import { friendlyLabel } from './decisionCockpit';

export type ContributorStatus = 'missing' | 'unresolved' | 'known' | 'verified';
export type Effort = 'Low' | 'Medium' | 'High';

export interface ContributorInput {
  code: string;
  label: string;
  dimension: keyof OpportunityComponents;
  status: ContributorStatus;
  conservativeValue: number;
  currentValue: number;
  favourableValue: number;
  // If set, this penalty flag is forced TRUE in the conservative scenario
  // and FALSE in the favourable one — used for contributors whose real-world
  // risk is a hard penalty (e.g. compliance), not just a soft score dimension.
  conservativePenalty?: keyof OpportunityPenalties;
  effort: Effort;
  researchTask: string;
}

export interface UncertaintyContributor {
  code: string;
  label: string;
  status: ContributorStatus;
  downsidePoints: number;
  upsidePoints: number;
  effort: Effort;
  researchTask: string;
}

export type DecisionStability = 'Stable Launch' | 'Stable Reject' | 'Conditional' | 'Unstable' | 'Insufficient evidence';

export interface VerdictTransition {
  targetRecommendation: RecommendationClass;
  conditions: string[];
}

export interface ResearchPriority {
  rank: number;
  code: string;
  task: string;
  possibleImpact: number;
  effort: Effort;
}

export interface DecisionConfidenceResult {
  scoreVersion: string;
  baseScore: number;
  lowScore: number;
  highScore: number;
  confidence: 'Low' | 'Medium' | 'High';
  decisionStability: DecisionStability;
  currentRecommendation: RecommendationClass;
  possibleRecommendations: RecommendationClass[];
  contributors: UncertaintyContributor[];
  movesUpIf: VerdictTransition | null;
  movesDownIf: VerdictTransition | null;
  researchPriorities: ResearchPriority[];
}

// A contributor already fully verified/known carries no uncertainty at all
// — its bounds collapse onto the current value. This is enforced here
// rather than trusted to callers, so "verified compliance narrows the
// range" holds even if a caller forgets to collapse it themselves.
function normalize(c: ContributorInput): ContributorInput {
  if (c.status === 'verified' || c.status === 'known') {
    return { ...c, conservativeValue: c.currentValue, favourableValue: c.currentValue, conservativePenalty: undefined };
  }
  return c;
}

function buildScenario(
  base: OpportunityComponents,
  basePenalties: OpportunityPenalties,
  contributors: ContributorInput[],
  mode: 'conservative' | 'favourable',
): { components: OpportunityComponents; penalties: OpportunityPenalties } {
  const components = { ...base } as Record<string, number>;
  const penalties = { ...basePenalties };

  const byDimension = new Map<string, number[]>();
  for (const c of contributors) {
    const val = mode === 'conservative' ? c.conservativeValue : c.favourableValue;
    byDimension.set(c.dimension, [...(byDimension.get(c.dimension) ?? []), val]);
  }
  for (const [dim, vals] of byDimension) {
    components[dim] = mode === 'conservative' ? Math.min(...vals) : Math.max(...vals);
  }

  for (const c of contributors) {
    if (!c.conservativePenalty) continue;
    if (mode === 'conservative') penalties[c.conservativePenalty] = true;
    else penalties[c.conservativePenalty] = false;
  }

  return { components: components as unknown as OpportunityComponents, penalties };
}

function bandRank(rec: RecommendationClass): number {
  return ['Reject', 'Weak opportunity', 'Negotiate or monitor', 'Order samples and validate', 'Strong launch candidate'].indexOf(rec);
}

export function computeDecisionConfidence(
  baseComponents: OpportunityComponents,
  basePenalties: OpportunityPenalties,
  rawContributors: ContributorInput[],
  dataCompletenessPercent: number,
): DecisionConfidenceResult {
  const contributors = rawContributors.map(normalize);
  const base = calculateOpportunityScore(baseComponents, basePenalties);

  const lowScenario = buildScenario(baseComponents, basePenalties, contributors, 'conservative');
  const highScenario = buildScenario(baseComponents, basePenalties, contributors, 'favourable');
  const lowResult = calculateOpportunityScore(lowScenario.components, lowScenario.penalties);
  const highResult = calculateOpportunityScore(highScenario.components, highScenario.penalties);

  const contributorRows: UncertaintyContributor[] = contributors.map((c) => {
    const downScenario = buildScenario(baseComponents, basePenalties, [c], 'conservative');
    const upScenario = buildScenario(baseComponents, basePenalties, [c], 'favourable');
    const downResult = calculateOpportunityScore(downScenario.components, downScenario.penalties);
    const upResult = calculateOpportunityScore(upScenario.components, upScenario.penalties);
    return {
      code: c.code,
      label: c.label,
      status: c.status,
      downsidePoints: Math.round(Math.max(0, base.finalScore - downResult.finalScore) * 10) / 10,
      upsidePoints: Math.round(Math.max(0, upResult.finalScore - base.finalScore) * 10) / 10,
      effort: c.effort,
      researchTask: c.researchTask,
    };
  });

  const range = highResult.finalScore - lowResult.finalScore;
  const confidence: DecisionConfidenceResult['confidence'] = range >= 25 ? 'Low' : range >= 10 ? 'Medium' : 'High';

  let decisionStability: DecisionStability;
  if (dataCompletenessPercent < 30) {
    decisionStability = 'Insufficient evidence';
  } else if (lowResult.recommendation === highResult.recommendation) {
    const rank = bandRank(lowResult.recommendation);
    decisionStability = rank >= 3 ? 'Stable Launch' : rank === 0 ? 'Stable Reject' : 'Conditional';
  } else if (bandRank(lowResult.recommendation) === 0 && bandRank(highResult.recommendation) >= 3) {
    decisionStability = 'Unstable';
  } else {
    decisionStability = 'Conditional';
  }

  const possibleRecommendations = Array.from(new Set([lowResult.recommendation, base.recommendation, highResult.recommendation]));

  // Greedy, deterministic search for the smallest set of favourable/conservative
  // flips (sorted by impact) that crosses into a better/worse recommendation
  // band than the current one — reproducible given the same inputs.
  function findTransition(direction: 'up' | 'down'): VerdictTransition | null {
    const sorted = [...contributors].sort((a, b) => {
      const impactA = direction === 'up' ? contributorRows.find((r) => r.code === a.code)!.upsidePoints : contributorRows.find((r) => r.code === a.code)!.downsidePoints;
      const impactB = direction === 'up' ? contributorRows.find((r) => r.code === b.code)!.upsidePoints : contributorRows.find((r) => r.code === b.code)!.downsidePoints;
      return impactB - impactA;
    });

    const flipped: ContributorInput[] = [];
    for (const c of sorted) {
      const impact = direction === 'up' ? contributorRows.find((r) => r.code === c.code)!.upsidePoints : contributorRows.find((r) => r.code === c.code)!.downsidePoints;
      if (impact <= 0) continue;
      flipped.push(c);
      const scenario = buildScenario(baseComponents, basePenalties, flipped, direction === 'up' ? 'favourable' : 'conservative');
      const result = calculateOpportunityScore(scenario.components, scenario.penalties);
      const better = direction === 'up' ? bandRank(result.recommendation) > bandRank(base.recommendation) : bandRank(result.recommendation) < bandRank(base.recommendation);
      if (better) {
        return {
          targetRecommendation: result.recommendation,
          conditions: flipped.map((f) => `${f.label} reaches its ${direction === 'up' ? 'favourable' : 'conservative'} value (${direction === 'up' ? f.favourableValue : f.conservativeValue})`),
        };
      }
    }
    return null;
  }

  const movesUpIf = findTransition('up');
  const movesDownIf = findTransition('down');

  const researchPriorities: ResearchPriority[] = contributorRows
    .map((r) => ({ code: r.code, task: r.researchTask, possibleImpact: Math.max(r.downsidePoints, r.upsidePoints), effort: r.effort }))
    .filter((r) => r.possibleImpact > 0)
    .sort((a, b) => b.possibleImpact - a.possibleImpact)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return {
    scoreVersion: SCORE_VERSION,
    baseScore: base.finalScore,
    lowScore: lowResult.finalScore,
    highScore: highResult.finalScore,
    confidence,
    decisionStability,
    currentRecommendation: base.recommendation,
    possibleRecommendations,
    contributors: contributorRows,
    movesUpIf,
    movesDownIf,
    researchPriorities,
  };
}

export { friendlyLabel };
