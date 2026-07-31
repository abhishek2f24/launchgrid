// Seeds ONE clearly-labeled example research report for the public
// /research search (see src/app/api/research/public-search/route.ts).
//
//   node scripts/seed-public-demo-research.mjs
//
// Safe & reversible: everything hangs off one fixed demo account
// (DEMO_EMAIL) and one fixed product_idea id. Re-running wipes & re-inserts
// only that account's research rows. Nothing here ever touches a real
// user's data — this is the ONLY sanctioned way anything becomes publicly
// searchable (is_demo = true AND is_public = true, both required per
// migration 0028's fix for the real leak this replaces).

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !SERVICE_KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const sb = createClient(URL_, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message || error); process.exit(1); } };

const DEMO_EMAIL = 'research-demo@launchgrid.in';
const DEMO_PASSWORD = 'not-a-real-login-' + Math.random().toString(36).slice(2); // no one signs in as this account; password just needs to satisfy Supabase
const PRODUCT_IDEA_ID = '00000000-0000-4000-8000-000000000001';
const RESEARCH_PROJECT_ID = '00000000-0000-4000-8000-000000000002';
const SUPPLIER_ID = '00000000-0000-4000-8000-000000000003';

async function ensureDemoAuthUser() {
  const existing = await sb.from('users').select('id').eq('email', DEMO_EMAIL).maybeSingle();
  if (existing.data?.id) { console.log(`• demo account reused (${DEMO_EMAIL})`); return existing.data.id; }

  const created = await sb.auth.admin.createUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: 'LaunchGrid Example Research' } });
  if (created.data?.user) { console.log(`• demo account created (${DEMO_EMAIL})`); return created.data.user.id; }

  if (/already|registered|exist/i.test(created.error?.message || '')) {
    for (let page = 1; page <= 20; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((u) => u.email?.toLowerCase() === DEMO_EMAIL.toLowerCase());
      if (hit) { console.log(`• demo account found (${DEMO_EMAIL})`); return hit.id; }
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  die('create demo account', created.error || new Error('could not resolve demo account'));
}

async function main() {
  const userId = await ensureDemoAuthUser();

  // 0026's trigger backfills public.users on insert, but this account may
  // already have existed before that trigger was created — upsert directly
  // to be certain the FK target exists before anything below inserts.
  die('upsert public.users', (await sb.from('users').upsert({ id: userId, email: DEMO_EMAIL, full_name: 'LaunchGrid Example Research' })).error);

  die('upsert research_project', (await sb.from('research_projects').upsert({
    id: RESEARCH_PROJECT_ID, user_id: userId, name: 'Example: Mesh Laundry Bag',
  })).error);

  die('upsert product_idea', (await sb.from('product_ideas').upsert({
    id: PRODUCT_IDEA_ID,
    research_project_id: RESEARCH_PROJECT_ID,
    user_id: userId,
    name: 'Mesh Laundry Bag (Set of 3) — Example',
    category: 'Home & Laundry',
    subcategory: 'Wash bags',
    target_retail_price: 499,
    max_preferred_moq: 500,
    max_initial_investment: 50000,
    has_compliance_evidence: false,
    status: 'launch_ready',
    is_demo: true,
    is_public: true,
    public_slug: 'mesh-laundry-bag-example',
    public_intent_keywords: ['mesh laundry bag', 'laundry bag', 'wash bag', 'delicates bag', 'garment wash bag'],
    published_at: new Date().toISOString(),
  })).error);

  die('upsert supplier', (await sb.from('research_suppliers').upsert({
    id: SUPPLIER_ID,
    product_idea_id: PRODUCT_IDEA_ID,
    supplier_name: 'Example Textile Co (sample data)',
    platform: 'Alibaba',
    country: 'China',
    currency: 'USD',
    moq: 500,
    lead_time_days: 25,
    audit_report_available: true,
    business_licence_available: true,
  })).error);

  die('upsert price tier', (await sb.from('research_price_tiers').upsert({
    id: '00000000-0000-4000-8000-000000000004',
    supplier_id: SUPPLIER_ID, quantity: 500, unit_price: 1.2, currency: 'USD',
  })).error);

  die('upsert supplier score', (await sb.from('research_supplier_scores').upsert({
    id: '00000000-0000-4000-8000-000000000005',
    supplier_id: SUPPLIER_ID,
    manufacturer_confidence_score: 68,
    manufacturer_confidence_label: 'Likely manufacturer',
    quality_score: 64,
    quality_label: 'Preliminary quality score — not sample verified',
    breakdown_json: { note: 'example data for public demo, not a real supplier assessment' },
  })).error);

  const landedCostId = '00000000-0000-4000-8000-000000000006';
  die('upsert landed cost', (await sb.from('research_landed_cost_scenarios').upsert({
    id: landedCostId,
    product_idea_id: PRODUCT_IDEA_ID, supplier_id: SUPPLIER_ID, quantity: 500,
    inputs_json: { quantity: 500, unitPriceForeign: 1.2, supplierCurrency: 'USD', fxRateToInr: 83 },
    outputs_json: { readyToSellCostPerUnit: 121.66, assumptionsUsed: ['fxBufferPct defaulted to 2%'] },
    confidence: 'Medium',
  })).error);

  die('upsert profitability', (await sb.from('research_profitability_scenarios').upsert({
    id: '00000000-0000-4000-8000-000000000007',
    product_idea_id: PRODUCT_IDEA_ID, channel: 'amazon_in', landed_cost_scenario_id: landedCostId, scenario_type: 'expected',
    inputs_json: { listingPrice: 499, readyToSellCostPerUnit: 121.66 },
    outputs_json: { contributionPerOrder: 162.7, contributionMarginPct: 0.326 },
  })).error);

  die('upsert opportunity score', (await sb.from('research_opportunity_scores').upsert({
    id: '00000000-0000-4000-8000-000000000008',
    product_idea_id: PRODUCT_IDEA_ID, supplier_id: SUPPLIER_ID,
    score: 55.73, recommendation: 'Negotiate or monitor', score_version: '1',
    breakdown_json: {
      breakdown: [
        { dimension: 'marginScore', weight: 1, input: 81, contribution: 0 },
        { dimension: 'manufacturerConfidenceScore', weight: 1, input: 68, contribution: 0 },
      ],
      penaltiesApplied: [], rawScore: 55.73, finalScore: 55.73, scoreVersion: '1',
    },
  })).error);

  console.log('✓ Public demo research seeded — /research?idea=mesh%20laundry%20bag should now show one clearly-labeled example result.');
}

main();
