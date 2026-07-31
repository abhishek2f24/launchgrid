// Runs the REAL research engines (not fabricated outputs) against a batch of
// trending/most-searched product categories, and writes genuine research
// records into the live Research module tables.
//
//   node scripts/seed-catalog-research.mjs
//
// Every input below is a realistic STARTING ASSUMPTION for that product
// category (typical sourcing-platform unit price, typical Indian D2C retail
// price, plausible supplier evidence) — exactly what a real seller would
// type in on day one, before they've gotten a confirmed quote. Every OUTPUT
// (landed cost, margin, manufacturer confidence, opportunity score, verdict)
// is computed live by the actual deterministic engines in
// src/lib/research/engines/ — nothing here hardcodes a result.
//
// Owned by a dedicated account so this never lands inside a real user's
// workspace. Safe & idempotent: re-running updates the same fixed-id rows.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateManufacturerConfidence } from '../src/lib/research/engines/manufacturerConfidence.ts';
import { calculateQualityScore } from '../src/lib/research/engines/quality.ts';
import { calculateLandedCost } from '../src/lib/research/engines/landedCost.ts';
import { calculateAllScenarios, DEFAULT_FEE_PROFILES } from '../src/lib/research/engines/profitability.ts';
import { calculateOpportunityScore } from '../src/lib/research/engines/opportunityScore.ts';
import { buildReadinessMatrix, buildVerdict, buildBlockers, computeRecommendedOrder } from '../src/lib/research/engines/decisionCockpit.ts';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message || error); process.exit(1); } };

const OWNER_EMAIL = 'catalog-research@launchgrid.in';
const FX_USD_INR = 83;

// Sourced from a July 2026 web search on trending/most-searched dropshipping
// products in India — see hostinger.com, accio.com, deodap.in, unicsi.com.
// Unit prices and MOQs are typical Alibaba/1688 ranges for each category,
// not a confirmed quote from any specific factory.
const PRODUCTS = [
  { name: 'Smart Fitness Ring', category: 'Wearables & Fitness', retail: 2999, unitPriceUsd: 8.5, moq: 300, country: 'China', licence: true, audit: true, factoryAddr: true, custom: false, exportHist: true, demand: 72, competition: 55, differentiation: 55, returnRisk: 50, shipping: 62 },
  { name: 'LED Red Light Therapy Face Mask', category: 'Beauty & Skincare', retail: 1999, unitPriceUsd: 6.2, moq: 500, country: 'China', licence: true, audit: false, factoryAddr: true, custom: true, exportHist: false, demand: 68, competition: 48, differentiation: 58, returnRisk: 60, shipping: 65 },
  { name: 'AI Pet Camera', category: 'Pet Tech', retail: 3499, unitPriceUsd: 12, moq: 200, country: 'China', licence: true, audit: true, factoryAddr: true, custom: false, exportHist: true, demand: 66, competition: 50, differentiation: 60, returnRisk: 48, shipping: 55 },
  { name: '3-in-1 Wireless Charging Dock', category: 'Mobile Accessories', retail: 1499, unitPriceUsd: 4.8, moq: 500, country: 'China', licence: true, audit: false, factoryAddr: false, custom: false, exportHist: false, demand: 60, competition: 25, differentiation: 30, returnRisk: 60, shipping: 68 },
  { name: 'Portable Massage Gun', category: 'Wellness', retail: 2499, unitPriceUsd: 9.5, moq: 300, country: 'China', licence: true, audit: true, factoryAddr: true, custom: false, exportHist: true, demand: 70, competition: 40, differentiation: 50, returnRisk: 55, shipping: 58 },
  { name: 'GaN 65W Travel Adapter', category: 'Mobile Accessories', retail: 1299, unitPriceUsd: 3.9, moq: 1000, country: 'China', licence: true, audit: true, factoryAddr: true, custom: false, exportHist: true, demand: 62, competition: 35, differentiation: 45, returnRisk: 62, shipping: 66 },
  { name: 'Mini Car Vacuum Cleaner', category: 'Auto Accessories', retail: 899, unitPriceUsd: 3.2, moq: 1000, country: 'China', licence: false, audit: false, factoryAddr: false, custom: false, exportHist: false, tradingOnly: true, demand: 55, competition: 30, differentiation: 35, returnRisk: 55, shipping: 60 },
  { name: 'Portable Blender Bottle', category: 'Kitchen & Wellness', retail: 999, unitPriceUsd: 3.5, moq: 500, country: 'China', licence: true, audit: false, factoryAddr: true, custom: false, exportHist: false, demand: 58, competition: 42, differentiation: 42, returnRisk: 68, shipping: 63 },
  { name: 'Smart Water Bottle (Hydration Reminder)', category: 'Wellness Tech', retail: 1499, unitPriceUsd: 4.6, moq: 500, country: 'China', licence: true, audit: false, factoryAddr: true, custom: false, exportHist: false, demand: 60, competition: 45, differentiation: 52, returnRisk: 62, shipping: 64 },
  { name: 'Beard Shaping Kit', category: 'Grooming', retail: 599, unitPriceUsd: 180, moq: 1000, country: 'India', licence: true, audit: false, factoryAddr: true, custom: false, exportHist: false, demand: 55, competition: 35, differentiation: 40, returnRisk: 72, shipping: 70 },
  { name: 'Jade Roller & Gua Sha Set', category: 'Beauty Tools', retail: 499, unitPriceUsd: 0.9, moq: 2000, country: 'China', licence: false, audit: false, factoryAddr: true, custom: false, exportHist: false, broadCatalogue: true, demand: 50, competition: 20, differentiation: 25, returnRisk: 70, shipping: 72 },
  { name: 'Magnetic Spice Rack Organizer', category: 'Kitchen', retail: 799, unitPriceUsd: 220, moq: 500, country: 'India', licence: true, audit: false, factoryAddr: true, custom: false, exportHist: false, demand: 52, competition: 45, differentiation: 40, returnRisk: 72, shipping: 62 },
  { name: 'Multi-Function Vegetable Chopper', category: 'Kitchen', retail: 699, unitPriceUsd: 2.1, moq: 1000, country: 'China', licence: true, audit: false, factoryAddr: false, custom: false, exportHist: false, demand: 58, competition: 32, differentiation: 35, returnRisk: 68, shipping: 65 },
  { name: 'Cable Organizer Set', category: 'Mobile Accessories', retail: 399, unitPriceUsd: 0.7, moq: 2000, country: 'China', licence: false, audit: false, factoryAddr: false, custom: false, exportHist: false, broadCatalogue: true, identicalPhotos: true, demand: 48, competition: 15, differentiation: 20, returnRisk: 75, shipping: 78 },
  { name: 'Reusable Silicone Produce Bags', category: 'Eco-Friendly Household', retail: 599, unitPriceUsd: 1.3, moq: 1000, country: 'China', licence: true, audit: false, factoryAddr: true, custom: false, exportHist: false, demand: 54, competition: 50, differentiation: 48, returnRisk: 68, shipping: 66 },
];

async function ensureOwner() {
  const existing = await sb.from('users').select('id').eq('email', OWNER_EMAIL).maybeSingle();
  if (existing.data?.id) { console.log(`• owner account reused (${OWNER_EMAIL})`); return existing.data.id; }
  const created = await sb.auth.admin.createUser({ email: OWNER_EMAIL, password: 'not-a-real-login-' + Math.random().toString(36).slice(2), email_confirm: true, user_metadata: { full_name: 'LaunchGrid Catalog Research' } });
  if (created.data?.user) { console.log(`• owner account created (${OWNER_EMAIL})`); return created.data.user.id; }
  if (/already|registered|exist/i.test(created.error?.message || '')) {
    for (let page = 1; page <= 20; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());
      if (hit) return hit.id;
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  die('create owner account', created.error || new Error('could not resolve owner account'));
}

function fixedUuid(seed) {
  // Deterministic fixed ids (valid UUID v4 shape) so re-running this script
  // updates the same rows instead of duplicating them.
  const hex = createHash('sha256').update(seed).digest('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

async function researchOne(userId, projectId, p) {
  const ideaId = fixedUuid('idea-' + p.name);
  const publicSlug = slugify(p.name);
  const keywords = [p.name.toLowerCase(), p.category.toLowerCase(), ...p.name.toLowerCase().split(' ').filter((w) => w.length > 3)];
  const supplierId = fixedUuid('supplier-' + p.name);
  const tierId = fixedUuid('tier-' + p.name);
  const scoreId = fixedUuid('score-' + p.name);
  const landedCostId = fixedUuid('lc-' + p.name);
  const oppId = fixedUuid('opp-' + p.name);

  die(`upsert idea (${p.name})`, (await sb.from('product_ideas').upsert({
    id: ideaId, research_project_id: projectId, user_id: userId,
    name: p.name, category: p.category, target_retail_price: p.retail,
    max_preferred_moq: p.moq, max_initial_investment: 75000,
    has_compliance_evidence: false, status: 'researching',
    // Published as demo/example content for the public /research category
    // browser — deliberate, dedicated-account seeded content, not real user
    // data (see migration 0028's is_demo+is_public double-gate).
    is_demo: true, is_public: true, public_slug: publicSlug, public_intent_keywords: [...new Set(keywords)],
    published_at: new Date().toISOString(),
  })).error);

  die(`upsert supplier (${p.name})`, (await sb.from('research_suppliers').upsert({
    id: supplierId, product_idea_id: ideaId,
    supplier_name: `${p.category} Supplier (${p.country})`, platform: p.country === 'India' ? 'IndiaMART' : 'Alibaba',
    country: p.country, currency: p.country === 'India' ? 'INR' : 'USD', moq: p.moq, lead_time_days: p.country === 'India' ? 12 : 28,
    business_licence_available: !!p.licence, audit_report_available: !!p.audit, factory_address_disclosed: !!p.factoryAddr,
    customisation_capability: !!p.custom, export_history: !!p.exportHist,
    broad_unrelated_catalogue: !!p.broadCatalogue, identical_photos_flag: !!p.identicalPhotos, trading_only_scope: !!p.tradingOnly,
  })).error);

  die(`upsert tier (${p.name})`, (await sb.from('research_price_tiers').upsert({
    id: tierId, supplier_id: supplierId, quantity: p.moq, unit_price: p.unitPriceUsd, currency: p.country === 'India' ? 'INR' : 'USD',
  })).error);

  // --- REAL ENGINE CALLS ---
  const mc = calculateManufacturerConfidence({
    businessLicenceSupportsManufacturing: !!p.licence, factoryAuditAvailable: !!p.audit, factoryAddressVerified: !!p.factoryAddr,
    productSpecificManufacturingCapability: !!p.custom, exportHistory: !!p.exportHist,
    veryBroadUnrelatedCatalogue: !!p.broadCatalogue, identicalPhotosUsedByManySellers: !!p.identicalPhotos,
    factoryLocationNotDisclosed: !p.factoryAddr, companyScopeAppearsTradingOnly: !!p.tradingOnly,
  });
  const q = calculateQualityScore({
    specificationCompletenessPct: 0.6, materialQualityScore: 60, constructionScore: 60,
    certificationTestScore: p.audit ? 70 : 40, reviewQualityScore: 55, defectComplaintRatePct: 0.1, sampleInspectionScore: null,
  });
  die(`upsert supplier score (${p.name})`, (await sb.from('research_supplier_scores').upsert({
    id: scoreId, supplier_id: supplierId, manufacturer_confidence_score: mc.score, manufacturer_confidence_label: mc.label,
    quality_score: q.score, quality_label: q.label, breakdown_json: { manufacturerConfidence: mc, quality: q },
  })).error);

  const fxRateToInr = p.country === 'India' ? 1 : FX_USD_INR;
  const landedCost = calculateLandedCost({ quantity: p.moq, unitPriceForeign: p.unitPriceUsd, supplierCurrency: p.country === 'India' ? 'INR' : 'USD', fxRateToInr, customsDutyPct: p.country === 'India' ? 0 : undefined });
  die(`upsert landed cost (${p.name})`, (await sb.from('research_landed_cost_scenarios').upsert({
    id: landedCostId, product_idea_id: ideaId, supplier_id: supplierId, quantity: p.moq,
    inputs_json: { quantity: p.moq, unitPriceForeign: p.unitPriceUsd, supplierCurrency: p.country === 'India' ? 'INR' : 'USD', fxRateToInr },
    outputs_json: landedCost, confidence: landedCost.confidence,
  })).error);

  const scenarios = calculateAllScenarios({ listingPrice: p.retail, readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit, fees: DEFAULT_FEE_PROFILES.amazon_in, initialInventorySpend: landedCost.totalCashRequirement });
  const rows = Object.entries(scenarios).map(([scenario_type, outputs_json]) => ({
    id: fixedUuid('profit-' + p.name + scenario_type), product_idea_id: ideaId, channel: 'amazon_in', landed_cost_scenario_id: landedCostId,
    scenario_type, inputs_json: { listingPrice: p.retail, readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit }, outputs_json,
  }));
  die(`upsert profitability (${p.name})`, (await sb.from('research_profitability_scenarios').upsert(rows)).error);

  const expected = scenarios.expected;
  const marginScore = Math.max(0, Math.min(100, Math.round((expected.contributionMarginPct / 0.4) * 100)));
  const supplierMoqInvestment = p.moq * landedCost.readyToSellCostPerUnit;
  const moqSuitabilityScore = supplierMoqInvestment <= 75000 ? 90 : supplierMoqInvestment <= 150000 ? 55 : 20;

  const components = {
    marginScore, demandScore: p.demand, competitionGapScore: p.competition, improvementOpportunityScore: p.differentiation,
    qualityScore: q.score, manufacturerConfidenceScore: mc.score, moqSuitabilityScore, capitalScore: moqSuitabilityScore,
    returnRiskScore: p.returnRisk, complianceScore: 35, shippingSuitabilityScore: p.shipping,
  };
  const result = calculateOpportunityScore(components, {});
  die(`upsert opportunity score (${p.name})`, (await sb.from('research_opportunity_scores').upsert({
    id: oppId, product_idea_id: ideaId, supplier_id: supplierId, score: result.finalScore, recommendation: result.recommendation,
    breakdown_json: result, score_version: result.scoreVersion,
  })).error);

  const recommendedOrder = computeRecommendedOrder(p.moq, 75000, landedCost.readyToSellCostPerUnit);
  const readinessMatrix = buildReadinessMatrix(result.breakdown, result.penaltiesApplied, recommendedOrder.inventoryRisk);
  const blockers = buildBlockers(readinessMatrix, { recommendedTestQty: recommendedOrder.recommendedTestQty, supplierMoq: recommendedOrder.supplierMoq });
  const verdict = buildVerdict(result.recommendation, blockers);
  const launchReady = result.recommendation === 'Strong launch candidate' || result.recommendation === 'Order samples and validate';
  die(`update idea status (${p.name})`, (await sb.from('product_ideas').update({ status: launchReady ? 'launch_ready' : 'researching' }).eq('id', ideaId)).error);

  console.log(`✓ ${p.name.padEnd(38)} score ${result.finalScore.toFixed(0).padStart(3)}  ${verdict.primaryDecision.padEnd(16)} margin ${(expected.contributionMarginPct * 100).toFixed(1)}%  mfg:${mc.label}`);
}

async function main() {
  const userId = await ensureOwner();
  die('upsert public.users', (await sb.from('users').upsert({ id: userId, email: OWNER_EMAIL, full_name: 'LaunchGrid Catalog Research' })).error);

  const projectId = fixedUuid('project-trending-2026');
  die('upsert research project', (await sb.from('research_projects').upsert({ id: projectId, user_id: userId, name: 'Trending Products Batch — July 2026' })).error);

  console.log(`\nResearching ${PRODUCTS.length} products with the real engines...\n`);
  for (const p of PRODUCTS) {
    await researchOne(userId, projectId, p);
  }
  console.log(`\n✓ Done. Log in as ${OWNER_EMAIL} → Research → "Trending Products Batch — July 2026" to view all ${PRODUCTS.length} reports.`);
}

main();
