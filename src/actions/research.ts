'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { calculateManufacturerConfidence, type ManufacturerSignals } from '@/lib/research/engines/manufacturerConfidence'
import { calculateQualityScore, type QualityComponents } from '@/lib/research/engines/quality'
import { calculateLandedCost, type LandedCostInputs } from '@/lib/research/engines/landedCost'
import { calculateAllScenarios, calculateProfitability, DEFAULT_FEE_PROFILES, type ProfitabilityInputs } from '@/lib/research/engines/profitability'
import { pickSourcingVerdict, recommendedUseFor, type SourcingScenario, type SourcingRisk, type SourcingRoute } from '@/lib/research/engines/sourcingScenarios'
import { calculateOpportunityScore, type OpportunityComponents, type OpportunityPenalties } from '@/lib/research/engines/opportunityScore'
import {
  buildReadinessMatrix,
  buildBlockers,
  buildVerdict,
  computeRecommendedOrder,
  computeCompleteness,
  withLabel,
  type RecommendedOrder,
} from '@/lib/research/engines/decisionCockpit'
import { computeDecisionConfidence, type ContributorInput } from '@/lib/research/engines/decisionConfidence'

type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

// ---------------------------------------------------------------------------
// Data provenance (migration 0032). Every supplier / price tier / idea declares
// where its numbers came from, so the report UI can stop presenting demo filler
// and self-entered guesses with the same authority as a real scrape.
// ---------------------------------------------------------------------------

export type ResearchDataSource = 'scraped' | 'manual' | 'seeded' | 'unknown'

export interface ProvenanceFields {
  data_source: ResearchDataSource
  extraction_confidence: number | null
  parser_version: string | null
  source_url: string | null
  scraped_at: string | null
}

export interface ResearchPriceTierRow extends ProvenanceFields {
  id: string
  quantity: number
  unit_price: number
  currency: string
  incoterm: string | null
}

export interface ResearchSupplierScoreRow {
  id: string
  manufacturer_confidence_score: number
  manufacturer_confidence_label: string
  quality_score: number | null
  quality_label: string | null
}

export interface ResearchSupplierRow extends ProvenanceFields {
  id: string
  supplier_name: string
  platform: string | null
  country: string | null
  city: string | null
  currency: string | null
  moq: number | null
  lead_time_days: number | null
  store_url: string | null
  research_supplier_scores: ResearchSupplierScoreRow[] | null
  research_price_tiers: ResearchPriceTierRow[] | null
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null as null }
  return { supabase, user }
}

/**
 * Resolves the current session's plan tier, mirroring the lookup the
 * `finalize_research_report` DB function does (highest active subscription
 * across the user's tenants; 'free' if none). Used to gate the full
 * decision-cockpit report behind a paid plan — free users can still create
 * research and see the raw supplier/cost data they entered, just not the
 * synthesized verdict.
 */
export async function getCurrentPlanTier(): Promise<string> {
  const { supabase, user } = await requireUser()
  if (!user) return 'free'
  const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', user.id).maybeSingle()
  if (!tenant) return 'free'
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan_tier')
    .eq('tenant_id', tenant.id)
    .eq('status', 'active')
    .maybeSingle()
  return (sub?.plan_tier as string) ?? 'free'
}

// ---------------------------------------------------------------------------
// Research projects & product ideas
// ---------------------------------------------------------------------------

export async function createResearchProject(name: string): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  const trimmed = name.trim()
  if (trimmed.length < 2) return { error: 'Give the research a name (at least 2 characters)' }

  const { data, error } = await supabase.from('research_projects').insert({ user_id: user.id, name: trimmed }).select('id').single()
  if (error) return { error: error.message }
  return { data: { id: data.id } }
}

export async function listResearchProjects() {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase.from('research_projects').select('id, name, created_at').order('created_at', { ascending: false })
  return data ?? []
}

/**
 * Creates a private research draft. A report credit is intentionally not
 * consumed here: credits are finalized atomically only when a usable
 * opportunity report is generated in runOpportunityScore().
 */
export async function createProductIdea(input: {
  researchProjectId: string
  name: string
  category?: string
  subcategory?: string
  targetRetailPrice?: number
  maxPreferredMoq?: number
  maxInitialInvestment?: number
}): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  if (!input.name?.trim() || input.name.trim().length < 2) return { error: 'Product name must be at least 2 characters' }

  // Reject ideas aimed at a project the caller can't see, rather than silently creating an
  // orphaned row attributed to their own tenant.
  const { data: ownedProject } = await supabase
    .from('research_projects')
    .select('id')
    .eq('id', input.researchProjectId)
    .maybeSingle()
  if (!ownedProject) return { error: 'Research project not found' }

  const { data: idea, error } = await supabase
    .from('product_ideas')
    .insert({
      research_project_id: input.researchProjectId,
      user_id: user.id,
      name: input.name.trim(),
      category: input.category?.trim() || null,
      subcategory: input.subcategory?.trim() || null,
      target_retail_price: input.targetRetailPrice ?? null,
      max_preferred_moq: input.maxPreferredMoq ?? null,
      max_initial_investment: input.maxInitialInvestment ?? null,
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  return { data: { id: idea.id } }
}

/**
 * Marks compliance evidence as reviewed (or un-reviewed). Deliberately a
 * separate, explicit action rather than a field on the create form — this
 * should only ever flip to true once someone has actually looked at the
 * document, not as a default checkbox ticked at creation time.
 */
export async function setComplianceEvidence(productIdeaId: string, hasEvidence: boolean): Promise<ActionResult<{ ok: true }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  const { error } = await supabase.from('product_ideas').update({ has_compliance_evidence: hasEvidence, updated_at: new Date().toISOString() }).eq('id', productIdeaId)
  if (error) return { error: error.message }
  return { data: { ok: true } }
}

/**
 * Returns the project only if the signed-in user can actually see it (RLS-scoped).
 * Callers use this to 404 on someone else's project id instead of rendering an
 * empty-but-functional project page for a resource that isn't theirs.
 */
export async function getResearchProject(researchProjectId: string) {
  const { supabase, user } = await requireUser()
  if (!user) return null
  const { data } = await supabase
    .from('research_projects')
    .select('id, name, created_at')
    .eq('id', researchProjectId)
    .maybeSingle()
  return data ?? null
}

export async function listProductIdeas(researchProjectId: string) {
  const { supabase, user } = await requireUser()
  if (!user) return []
  const { data } = await supabase
    .from('product_ideas')
    .select('id, name, category, status, target_retail_price, created_at')
    .eq('research_project_id', researchProjectId)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export interface SupplierInput {
  supplierName: string
  platform?: string
  country?: string
  city?: string
  currency?: string
  moq?: number
  leadTimeDays?: number
  storeUrl?: string
  yearEstablished?: number
  customisationCapability?: boolean
  auditReportAvailable?: boolean
  businessLicenceAvailable?: boolean
  factoryAddressDisclosed?: boolean
  factoryVideoAvailable?: boolean
  exportHistory?: boolean
  reviewRating?: number
}

export async function addSupplier(productIdeaId: string, input: SupplierInput): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  if (!input.supplierName?.trim() || input.supplierName.trim().length < 2) return { error: 'Supplier name must be at least 2 characters' }

  const { data, error } = await supabase
    .from('research_suppliers')
    .insert({
      product_idea_id: productIdeaId,
      supplier_name: input.supplierName.trim(),
      platform: input.platform ?? null,
      country: input.country ?? null,
      city: input.city ?? null,
      currency: input.currency ?? 'USD',
      moq: input.moq ?? null,
      lead_time_days: input.leadTimeDays ?? null,
      store_url: input.storeUrl ?? null,
      year_established: input.yearEstablished ?? null,
      customisation_capability: !!input.customisationCapability,
      audit_report_available: !!input.auditReportAvailable,
      business_licence_available: !!input.businessLicenceAvailable,
      factory_address_disclosed: !!input.factoryAddressDisclosed,
      factory_video_available: !!input.factoryVideoAvailable,
      export_history: !!input.exportHistory,
      review_rating: input.reviewRating ?? null,
      // Typed by the merchant in the dashboard — never claim this is scraped evidence.
      data_source: 'manual',
    })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { data: { id: data.id } }
}

export async function addPriceTier(supplierId: string, input: { quantity: number; unitPrice: number; currency?: string; incoterm?: string }): Promise<ActionResult<{ id: string }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  const { data, error } = await supabase
    .from('research_price_tiers')
    // India-first default: an unspecified currency means rupees. Defaulting to USD silently
    // multiplied every rupee price by the ~83 FX rate, so a ₹120 tier produced a ₹12,000+
    // landed cost.
    .insert({ supplier_id: supplierId, quantity: input.quantity, unit_price: input.unitPrice, currency: input.currency ?? 'INR', incoterm: input.incoterm ?? null, data_source: 'manual' })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { data: { id: data.id } }
}

function supplierToManufacturerSignals(s: Record<string, unknown>): ManufacturerSignals {
  return {
    businessLicenceSupportsManufacturing: !!s.business_licence_available,
    factoryAuditAvailable: !!s.audit_report_available,
    factoryAddressVerified: !!s.factory_address_disclosed,
    productionLineEvidence: !!s.factory_video_available,
    productSpecificManufacturingCapability: !!s.customisation_capability,
    exportHistory: !!s.export_history,
    veryBroadUnrelatedCatalogue: !!s.broad_unrelated_catalogue,
    identicalPhotosUsedByManySellers: !!s.identical_photos_flag,
    factoryLocationNotDisclosed: !s.factory_address_disclosed,
    refusesAuditOrLiveVideo: !!s.refuses_audit_or_video,
    cannotExplainProductSpecifications: !!s.cannot_explain_specs,
    companyScopeAppearsTradingOnly: !!s.trading_only_scope,
    unrealisticallyLowPrice: !!s.unrealistically_low_price,
    conflictingCompanyNames: !!s.conflicting_company_names,
  }
}

export async function scoreSupplier(supplierId: string): Promise<ActionResult<{ manufacturerConfidence: ReturnType<typeof calculateManufacturerConfidence>; quality: ReturnType<typeof calculateQualityScore> }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }
  const { data: supplier, error: supplierErr } = await supabase.from('research_suppliers').select('*').eq('id', supplierId).single()
  if (supplierErr || !supplier) return { error: 'Supplier not found' }

  const mc = calculateManufacturerConfidence(supplierToManufacturerSignals(supplier))
  const quality: QualityComponents = {
    specificationCompletenessPct: 0.6,
    materialQualityScore: 60,
    constructionScore: 60,
    certificationTestScore: supplier.audit_report_available ? 70 : 40,
    reviewQualityScore: supplier.review_rating ? (Number(supplier.review_rating) / 5) * 100 : 50,
    defectComplaintRatePct: 0.1,
    sampleInspectionScore: null,
  }
  const q = calculateQualityScore(quality)

  const { error } = await supabase.from('research_supplier_scores').insert({
    supplier_id: supplierId,
    manufacturer_confidence_score: mc.score,
    manufacturer_confidence_label: mc.label,
    quality_score: q.score,
    quality_label: q.label,
    breakdown_json: { manufacturerConfidence: mc, quality: q },
  })
  if (error) return { error: error.message }
  return { data: { manufacturerConfidence: mc, quality: q } }
}

// ---------------------------------------------------------------------------
// Landed cost / profitability / opportunity score
// ---------------------------------------------------------------------------

export async function runLandedCost(input: {
  productIdeaId: string
  supplierId: string
  quantity: number
  overrides?: Partial<LandedCostInputs>
}): Promise<ActionResult<{ id: string; outputs: ReturnType<typeof calculateLandedCost> }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }

  const { data: supplier } = await supabase.from('research_suppliers').select('currency').eq('id', input.supplierId).single()
  const { data: tiers } = await supabase
    .from('research_price_tiers')
    .select('quantity, unit_price, currency, created_at')
    .eq('supplier_id', input.supplierId)
    .order('quantity', { ascending: true })

  // Pick the highest-quantity tier the order qualifies for, and among equal quantities the
  // most recently added one — so re-entering a tier to correct a mistake (e.g. a price saved
  // in the wrong currency) actually takes effect instead of the stale row winning.
  const applicable = (tiers ?? []).filter((t) => input.quantity >= t.quantity)
  const bestQuantity = applicable.length ? Math.max(...applicable.map((t) => t.quantity)) : null
  const applicableTier =
    bestQuantity === null
      ? tiers?.[0]
      : applicable
          .filter((t) => t.quantity === bestQuantity)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
  const unitPriceForeign = applicableTier?.unit_price ?? 0
  const currency = applicableTier?.currency ?? supplier?.currency ?? 'INR'
  const fxRateToInr = input.overrides?.fxRateToInr ?? (currency === 'USD' ? 83 : currency === 'CNY' ? 11.5 : 1)

  // Without a price tier there is no unit price to work from, so the result would be pure
  // overhead (freight/duty on a ₹0 item) presented as a real cost. Refuse instead of lying.
  if (!applicableTier || !unitPriceForeign) {
    return { error: 'Add a price tier for this supplier before calculating landed cost.' }
  }

  const inputs: LandedCostInputs = { quantity: input.quantity, unitPriceForeign, supplierCurrency: currency, fxRateToInr, ...input.overrides }
  const outputs = calculateLandedCost(inputs)

  const { data, error } = await supabase
    .from('research_landed_cost_scenarios')
    .insert({ product_idea_id: input.productIdeaId, supplier_id: input.supplierId, quantity: input.quantity, inputs_json: inputs, outputs_json: outputs, confidence: outputs.confidence })
    .select('id')
    .single()
  if (error) return { error: error.message }
  return { data: { id: data.id, outputs } }
}

export async function runProfitability(input: {
  productIdeaId: string
  channel: keyof typeof DEFAULT_FEE_PROFILES | string
  landedCostScenarioId: string
  readyToSellCostPerUnit: number
  listingPrice: number
  discountedPrice?: number
  initialInventorySpend?: number
  monthlyUnitsSold?: number
}): Promise<ActionResult<ReturnType<typeof calculateAllScenarios>>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }

  const feeProfile = DEFAULT_FEE_PROFILES[input.channel] ?? DEFAULT_FEE_PROFILES.amazon_in
  const base: Omit<ProfitabilityInputs, 'scenarioType'> = {
    listingPrice: input.listingPrice,
    discountedPrice: input.discountedPrice,
    readyToSellCostPerUnit: input.readyToSellCostPerUnit,
    fees: feeProfile,
    initialInventorySpend: input.initialInventorySpend,
    monthlyUnitsSold: input.monthlyUnitsSold,
  }
  const scenarios = calculateAllScenarios(base)

  const rows = Object.entries(scenarios).map(([scenarioType, outputs]) => ({
    product_idea_id: input.productIdeaId,
    channel: input.channel,
    landed_cost_scenario_id: input.landedCostScenarioId,
    scenario_type: scenarioType,
    inputs_json: base,
    outputs_json: outputs,
  }))
  const { error } = await supabase.from('research_profitability_scenarios').insert(rows)
  if (error) return { error: error.message }
  return { data: scenarios }
}

export async function runOpportunityScore(input: {
  productIdeaId: string
  supplierId?: string
  components: OpportunityComponents
  penalties?: OpportunityPenalties
}): Promise<ActionResult<ReturnType<typeof calculateOpportunityScore>>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }

  // Derive the negative-margin hard override from stored profitability rather than trusting
  // the caller: the verdict must never say "launch" for a product that loses money per unit.
  const { data: latestProfitability } = await supabase
    .from('research_profitability_scenarios')
    .select('outputs_json')
    .eq('product_idea_id', input.productIdeaId)
    .eq('scenario_type', 'expected')
    .order('created_at', { ascending: false })
    .limit(1)

  const expectedMarginPct = (
    latestProfitability?.[0]?.outputs_json as { contributionMarginPct?: number } | undefined
  )?.contributionMarginPct

  const penalties: OpportunityPenalties = {
    ...(input.penalties ?? {}),
    ...(typeof expectedMarginPct === 'number' && expectedMarginPct <= 0
      ? { negativeContributionMargin: true }
      : {}),
  }

  const result = calculateOpportunityScore(input.components, penalties)
  const { error } = await supabase.from('research_opportunity_scores').insert({
    product_idea_id: input.productIdeaId,
    supplier_id: input.supplierId ?? null,
    score: result.finalScore,
    recommendation: result.recommendation,
    breakdown_json: result,
    score_version: result.scoreVersion,
  })
  if (error) return { error: error.message }

  const { error: creditError } = await supabase.rpc('finalize_research_report', {
    p_product_idea_id: input.productIdeaId,
  })
  if (creditError) return { error: creditError.message }

  // "launch_ready" gates the Build-my-store CTA — see promoteResearchToProduct.
  const launchReady = result.recommendation === 'Strong launch candidate' || result.recommendation === 'Order samples and validate'
  await supabase.from('product_ideas').update({ status: launchReady ? 'launch_ready' : 'researching', updated_at: new Date().toISOString() }).eq('id', input.productIdeaId)

  return { data: result }
}

// ---------------------------------------------------------------------------
// Decision cockpit assembly — readiness matrix, blockers, verdict,
// recommended order, completeness, and decision-confidence range, all
// derived from data already stored above. Ported from SourceIQ's report.ts,
// computed on demand (no extra table) so it's always current with the
// latest opportunity score / landed cost rows. Sourcing-route scenarios
// (Domestic/China pilot/China scale) are NOT included yet — that needs
// multi-supplier country data this MVP doesn't collect, tracked as
// follow-up work.
// ---------------------------------------------------------------------------

interface OpportunityBreakdownJson {
  breakdown: { dimension: string; weight: number; input: number; contribution: number }[]
  penaltiesApplied: string[]
  rawScore: number
  finalScore: number
  scoreVersion: string
}

function assembleDecisionCockpit(input: {
  idea: { target_retail_price: number | null; max_initial_investment: number | null; has_compliance_evidence: boolean }
  breakdownJson: OpportunityBreakdownJson
  recommendation: string
  landedCostOutputs: { readyToSellCostPerUnit: number; assumptionsUsed?: string[] } | null
  recommendedSupplier: { moq: number | null; lead_time_days: number | null } | null
  supplierCount: number
}) {
  const raw = input.breakdownJson
  const components = {} as OpportunityComponents
  for (const b of raw.breakdown) (components as unknown as Record<string, number>)[b.dimension] = b.input
  const basePenalties: OpportunityPenalties = {}
  for (const code of raw.penaltiesApplied ?? []) (basePenalties as Record<string, boolean>)[code] = true

  const recommendedOrder: RecommendedOrder = computeRecommendedOrder(
    input.recommendedSupplier?.moq ?? null,
    input.idea.max_initial_investment,
    input.landedCostOutputs?.readyToSellCostPerUnit ?? null,
  )

  const readinessMatrix = buildReadinessMatrix(raw.breakdown, raw.penaltiesApplied ?? [], recommendedOrder.inventoryRisk)
  const blockers = buildBlockers(readinessMatrix, { recommendedTestQty: recommendedOrder.recommendedTestQty, supplierMoq: recommendedOrder.supplierMoq })
  const verdict = buildVerdict(input.recommendation, blockers)

  const completeness = computeCompleteness({
    hasTargetRetailPrice: input.idea.target_retail_price != null,
    hasMaxInvestment: input.idea.max_initial_investment != null,
    hasSupplierLeadTime: input.recommendedSupplier?.lead_time_days != null,
    hasComplianceEvidence: input.idea.has_compliance_evidence,
    hasDemandEstimate: false, // no marketplace-listing module ported yet — honest, not guessed
    hasConfirmedFeeProfile: false, // default marketplace fee profiles are always assumed today
    hasCartonDimensions: false, // not collected yet
    marketListingCount: 0,
    supplierCount: input.supplierCount,
    reviewCount: 0,
  })

  const freightConfirmed = !input.landedCostOutputs?.assumptionsUsed?.length
  const moqResolved = recommendedOrder.inventoryRisk === 'Low' || recommendedOrder.inventoryRisk == null
  const contributors: ContributorInput[] = [
    {
      code: 'complianceEvidence',
      label: 'Compliance verification',
      dimension: 'complianceScore',
      status: input.idea.has_compliance_evidence ? 'verified' : 'missing',
      conservativeValue: Math.min(components.complianceScore, 20),
      currentValue: components.complianceScore,
      favourableValue: 90,
      conservativePenalty: 'highRegulatoryUncertainty',
      effort: 'Low',
      researchTask: 'Request compliance/registration documents before placing a bulk order.',
    },
    {
      code: 'moqNegotiation',
      label: 'MOQ negotiation',
      dimension: 'moqSuitabilityScore',
      status: moqResolved ? 'known' : 'unresolved',
      conservativeValue: components.moqSuitabilityScore,
      currentValue: components.moqSuitabilityScore,
      favourableValue: Math.min(100, components.moqSuitabilityScore + 55),
      effort: 'Low',
      researchTask: `Negotiate MOQ down toward ${recommendedOrder.recommendedTestQty ?? 'a small pilot quantity'} units.`,
    },
    {
      code: 'sampleQuality',
      label: 'Sample quality result',
      dimension: 'qualityScore',
      status: 'unresolved',
      conservativeValue: Math.max(0, components.qualityScore - 20),
      currentValue: components.qualityScore,
      favourableValue: Math.min(100, components.qualityScore + 15),
      effort: 'Medium',
      researchTask: 'Order a product sample and get it independently quality-tested.',
    },
    {
      code: 'freightConfirmation',
      label: 'Confirmed freight quote',
      dimension: 'marginScore',
      status: freightConfirmed ? 'known' : 'unresolved',
      conservativeValue: Math.max(0, components.marginScore * 0.8),
      currentValue: components.marginScore,
      favourableValue: Math.min(100, components.marginScore * 1.02),
      effort: 'Low',
      researchTask: 'Confirm freight and duty costs with the logistics provider/customs broker.',
    },
    {
      code: 'feeConfirmation',
      label: 'Marketplace fee confirmation',
      dimension: 'marginScore',
      status: 'missing',
      conservativeValue: Math.max(0, components.marginScore * 0.9),
      currentValue: components.marginScore,
      favourableValue: components.marginScore,
      effort: 'Low',
      researchTask: 'Confirm the actual marketplace fee profile with the channel.',
    },
  ]

  const decisionConfidence = computeDecisionConfidence(components, basePenalties, contributors, completeness.percent)

  return {
    readinessMatrix,
    blockers,
    verdict,
    recommendedOrder,
    completeness,
    decisionConfidence,
    breakdown: raw.breakdown.map((b) => ({ ...b, ...withLabel(b.dimension) })),
  }
}

// ---------------------------------------------------------------------------
// Sourcing-route scenarios (Domestic validation / China pilot / China scale)
// — ported from report.ts's buildSourcingScenarios. The recommendation is
// growth-optimized (best contribution economics wins, see
// pickSourcingVerdict) — compliance/quality status is not a gate here, it
// surfaces separately via the readiness matrix and blockers list. Needs a
// supplier with country "India" and/or a supplier with country containing
// "china", each with at least one price tier — returns null otherwise
// rather than fabricating a route.
// ---------------------------------------------------------------------------

interface SupplierWithTiers {
  supplier_name: string
  country: string | null
  moq: number | null
  research_price_tiers: { quantity: number; unit_price: number; currency: string }[] | null
}

function pickTierPrice(tiers: { quantity: number; unit_price: number; currency: string }[], quantity: number) {
  const applicable = [...tiers].sort((a, b) => a.quantity - b.quantity).reverse().find((t) => quantity >= t.quantity)
  return applicable ?? tiers[0] ?? null
}

function buildSourcingScenarios(
  suppliers: SupplierWithTiers[],
  targetRetailPrice: number | null,
): { scenarios: SourcingScenario[]; verdict: ReturnType<typeof pickSourcingVerdict> } | null {
  const domesticSupplier = suppliers.find((s) => (s.country ?? '').toLowerCase() === 'india')
  const chinaSupplier = suppliers.find((s) => (s.country ?? '').toLowerCase().includes('china'))
  if (!targetRetailPrice || (!domesticSupplier && !chinaSupplier)) return null
  const price: number = targetRetailPrice

  function buildScenario(
    route: SourcingRoute,
    supplier: SupplierWithTiers | undefined,
    quantity: number,
    risk: SourcingRisk,
    isDomestic: boolean,
    criticalMissingInputs: string[],
  ): SourcingScenario | null {
    if (!supplier) return null
    const tiers = supplier.research_price_tiers
    if (!tiers?.length) return null
    const tier = pickTierPrice(tiers, quantity)
    if (!tier) return null
    const fxRateToInr = tier.currency === 'INR' ? 1 : tier.currency === 'USD' ? 83.2 : tier.currency === 'CNY' ? 11.5 : 1

    const landedCost = calculateLandedCost({
      quantity,
      unitPriceForeign: tier.unit_price,
      supplierCurrency: tier.currency,
      fxRateToInr,
      customsDutyPct: isDomestic ? 0 : 0.1,
      importIgstPct: isDomestic ? 0 : undefined,
      internationalFreightTotal: isDomestic ? 0 : undefined,
    })
    const profitability = calculateProfitability({
      listingPrice: price,
      readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit,
      fees: DEFAULT_FEE_PROFILES.amazon_in,
      initialInventorySpend: landedCost.totalCashRequirement,
    })

    const packaging = landedCost.costBridge.find((l) => l.label.includes('Packaging'))?.value ?? 0
    const freight = landedCost.costBridge.find((l) => l.label.includes('Freight'))?.value ?? 0
    const duty = landedCost.costBridge.find((l) => l.label.includes('Duty'))?.value ?? 0
    const testing = landedCost.costBridge.find((l) => l.label.includes('Testing'))?.value ?? 0

    return {
      route,
      supplierName: supplier.supplier_name,
      quantity,
      unitPriceForeign: tier.unit_price,
      currency: tier.currency,
      packagingCost: packaging,
      freightCost: freight,
      dutyAndImportCost: duty,
      testingComplianceCost: testing,
      readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit,
      totalCashRequired: landedCost.totalCashRequirement,
      contributionPerUnit: profitability.contributionPerOrder,
      contributionMarginPct: profitability.contributionMarginPct,
      breakEvenUnits: profitability.breakEvenUnits,
      inventoryExposureUnits: quantity,
      estimatedMonthsOfStock: null,
      risk,
      criticalMissingInputs,
      recommendedUse: recommendedUseFor(route),
    }
  }

  const domestic = buildScenario('Domestic validation', domesticSupplier, 300, 'Low', true, [
    'Confirmed domestic supplier lead time',
    'Confirmed domestic GST/compliance treatment',
  ])
  const pilot = buildScenario('China pilot', chinaSupplier, 500, 'Medium', false, [
    'Negotiated 500-unit price not yet confirmed by supplier (using lowest known tier as an estimate)',
  ])
  const scale = buildScenario('China scale', chinaSupplier, chinaSupplier?.moq ?? 2000, 'High', false, [])

  const scenarios = [domestic, pilot, scale].filter((s): s is SourcingScenario => s != null)
  if (scenarios.length === 0) return null
  return { scenarios, verdict: pickSourcingVerdict(scenarios) }
}

/**
 * Report assembly, parameterised by client so both the cookie-authenticated web path and
 * the Bearer-authenticated mobile endpoint share ONE implementation. The seven scoring
 * engines run here and nowhere else — a second implementation is how the two surfaces
 * start disagreeing.
 *
 * Types are derived from requireUser() rather than `any`: annotating these as `any`
 * collapsed this function's inferred return type, which silently broke type inference
 * for `Report` consumers in the web dashboard.
 */
type ResearchAuth = Awaited<ReturnType<typeof requireUser>>

export async function getResearchReportWithClient(
  supabase: ResearchAuth['supabase'],
  user: NonNullable<ResearchAuth['user']>,
  productIdeaId: string,
) {
  const [{ data: idea }, { data: rawSuppliers }, { data: opportunityScores }, { data: landedCosts }, { data: profitability }] = await Promise.all([
    supabase.from('product_ideas').select('*').eq('id', productIdeaId).single(),
    supabase.from('research_suppliers').select('*, research_supplier_scores(*), research_price_tiers(*)').eq('product_idea_id', productIdeaId),
    supabase.from('research_opportunity_scores').select('*').eq('product_idea_id', productIdeaId).order('created_at', { ascending: false }).limit(1),
    supabase.from('research_landed_cost_scenarios').select('*').eq('product_idea_id', productIdeaId).order('created_at', { ascending: false }),
    supabase.from('research_profitability_scenarios').select('*').eq('product_idea_id', productIdeaId).order('created_at', { ascending: false }),
  ])

  if (!idea) return null

  // `select('*')` already returns the provenance columns added in migration 0032;
  // this cast is what stops them being dropped on the way to the UI, which would
  // otherwise have no way to tell scraped evidence from demo filler.
  const suppliers = (rawSuppliers ?? []) as unknown as ResearchSupplierRow[]

  const opportunityScoreRow = opportunityScores?.[0] ?? null
  const landedCostOutputs = (landedCosts?.[0]?.outputs_json as { readyToSellCostPerUnit: number; assumptionsUsed?: string[] } | undefined) ?? null
  const recommendedSupplier = suppliers?.[0] ?? null

  const decisionCockpit = opportunityScoreRow
    ? assembleDecisionCockpit({
        idea: { target_retail_price: idea.target_retail_price, max_initial_investment: idea.max_initial_investment, has_compliance_evidence: idea.has_compliance_evidence },
        breakdownJson: opportunityScoreRow.breakdown_json as OpportunityBreakdownJson,
        recommendation: opportunityScoreRow.recommendation as string,
        landedCostOutputs,
        recommendedSupplier: recommendedSupplier ? { moq: recommendedSupplier.moq, lead_time_days: recommendedSupplier.lead_time_days } : null,
        supplierCount: suppliers?.length ?? 0,
      })
    : null

  const sourcingScenarios = buildSourcingScenarios(suppliers ?? [], idea.target_retail_price)

  return {
    idea,
    // Explicitly typed so the report header can state plainly whether the whole
    // report rests on demo inputs.
    ideaDataSource: ((idea.data_source as ResearchDataSource | null) ?? 'unknown') as ResearchDataSource,
    suppliers,
    opportunityScore: opportunityScoreRow,
    landedCosts: landedCosts ?? [],
    profitability: profitability ?? [],
    decisionCockpit,
    sourcingScenarios,
  }
}

export async function getResearchReport(productIdeaId: string) {
  const { supabase, user } = await requireUser()
  if (!user) return null
  return getResearchReportWithClient(supabase, user, productIdeaId)
}

// ---------------------------------------------------------------------------
// Build-my-store bridge
// ---------------------------------------------------------------------------

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() +
    '-' +
    Math.random().toString(36).slice(2, 7)
  )
}

/**
 * The one-click "Build my store" bridge: turns a launch_ready product idea
 * into a real storefront product, pre-filled from everything the research
 * already produced — retail price from the target price (or the last
 * landed-cost scenario's ready-to-sell cost + a default margin), sourcing
 * details preserved in products.metadata so nothing has to be re-typed.
 * Requires the caller to already have a tenant (store) — if not, the UI
 * should route through onboarding first and call this again after.
 */
export async function promoteResearchToProduct(
  productIdeaId: string,
  targetTenantId?: string,
): Promise<ActionResult<{ productId: string }>> {
  const { supabase, user } = await requireUser()
  if (!user) return { error: 'Not signed in' }

  const { data: ownedTenants } = await supabase.from('tenants').select('id').eq('owner_id', user.id)
  const tenantIds = ownedTenants?.map((tenant) => tenant.id) ?? []
  if (tenantIds.length === 0) return { error: 'Create your store first, then come back to launch this product into it.' }
  if (targetTenantId && !tenantIds.includes(targetTenantId)) return { error: 'You do not have access to that store.' }
  if (!targetTenantId && tenantIds.length > 1) return { error: 'Choose which of your stores should receive this product draft.' }
  const tenantId = targetTenantId ?? tenantIds[0]

  const { data: idea } = await supabase.from('product_ideas').select('*').eq('id', productIdeaId).single()
  if (!idea) return { error: 'Product idea not found' }
  if (idea.status !== 'launch_ready' && idea.status !== 'promoted') {
    return { error: 'This product is not launch-ready yet. Resolve the report blockers before creating a store draft.' }
  }
  if (idea.status === 'promoted' && idea.product_id) return { data: { productId: idea.product_id } }

  const { data: landedCost } = await supabase
    .from('research_landed_cost_scenarios')
    .select('outputs_json')
    .eq('product_idea_id', productIdeaId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: recommendedSupplier } = await supabase
    .from('research_suppliers')
    .select('id, supplier_name, platform, moq, store_url')
    .eq('product_idea_id', productIdeaId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const readyToSellCost = (landedCost?.outputs_json as { readyToSellCostPerUnit?: number } | null)?.readyToSellCostPerUnit
  const retailPrice = idea.target_retail_price ?? (readyToSellCost ? Math.round(readyToSellCost * 1.6) : null)
  if (!retailPrice) return { error: 'Set a target retail price or run a landed-cost calculation before building the store listing.' }

  const serviceSupabase = createServiceClient()
  const { data: product, error } = await serviceSupabase
    .from('products')
    .insert({
      tenant_id: tenantId,
      title: idea.name,
      description: null,
      retail_price: retailPrice,
      slug: slugify(idea.name),
      is_active: false, // merchant reviews before publishing — see dashboard
      source: 'research_module',
      metadata: {
        research_product_idea_id: productIdeaId,
        sourcing_supplier: recommendedSupplier ?? null,
        landed_cost_per_unit: readyToSellCost ?? null,
      },
    })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await supabase
    .from('product_ideas')
    .update({ status: 'promoted', tenant_id: tenantId, product_id: product.id, promoted_at: new Date().toISOString() })
    .eq('id', productIdeaId)

  revalidatePath('/dashboard/products')

  return { data: { productId: product.id } }
}
