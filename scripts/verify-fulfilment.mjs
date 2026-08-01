// End-to-end test of on-demand fulfilment, including the money paths.
//
//   node scripts/verify-fulfilment.mjs
//
// HOW IT AVOIDS TOUCHING INDIAMART
//   It stands up a local fixture server and points RESEARCH_PROXY_ENDPOINT at it, so
//   the real ProxyFetcher → detectBlock → parser → quality gate → ingest → refund path
//   executes exactly as in production, against controlled HTML. Nothing is mocked
//   inside the app; only the origin is substituted.
//
// PREREQUISITE
//   The dev server must be running. This script points RESEARCH_PROXY_ENDPOINT at its
//   own fixture for the duration of the run and restores the previous value on exit —
//   otherwise the fetcher falls through to the real IndiaMART, which bot-blocks and
//   makes every assertion fail for the wrong reason.

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const BASE = env.LG_BASE_URL || 'http://localhost:3000';
const EMAIL = env.LG_DEMO_EMAIL || 'bulk-demo@launchgrid.in';
const PASSWORD = env.LG_DEMO_PASSWORD || 'BulkDemo123!';
const WORKER_SECRET = env.RESEARCH_WORKER_SECRET;
const FIXTURE_PORT = 4599;

if (!WORKER_SECRET) { console.error('RESEARCH_WORKER_SECRET missing from .env.local'); process.exit(1); }

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

// ---- fixture HTML ----------------------------------------------------------
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const pad = `<div>${'filler '.repeat(400)}</div>`; // clears detectBlock's shell-size check

// Seller anchor now carries a real profile href — that link is what unlocks the
// contact details a merchant needs to actually act on the report.
const card = (name, price, title, loc) => `
<article class="im-lc-card">
  <a class="im-lc-name" href="/p">${title}</a>
  <p>₹ ${price}/Piece</p>
  <a class="im-lc-seller-name" href="/${slug(name)}/">${name}</a>
  <div>${loc}</div>
</article>`;

// Padded: detectBlock treats a sub-2KB body as a bot shell, and real IndiaMART
// profile pages are far larger. An unpadded fixture would be skipped as "blocked"
// and silently test nothing.
const profilePage = (name) => `<html><body>
  ${pad}
  <h1>${name}</h1>
  <a href="tel:+919876543210">Call</a>
  <a href="mailto:sales@${slug(name)}.co.in">Email</a>
  <div>Registered Address: 14 Industrial Estate, Makarpura, Vadodara, Gujarat 390010</div>
  <div>Minimum Order Quantity: 250 Pieces</div>
  <div>ISO 9001 certified · GST No 24AABCU9603R1ZM</div>
</body></html>`;


const GOOD = pad + card('Wiselife Wellness India Private Limited', '180', 'Yoga Mat 6mm', 'Gurugram · 10 yrs')
  + card('Surat Fitness Traders', '140', 'Yoga Mat TPE', 'Surat · 6 yrs')
  + card('Nirmal Sports House', '220', 'Yoga Mat Anti Skid', 'Jaipur · 12 yrs');

const THIN = pad + card('Only One Seller', '99', 'Widget', 'Surat · 3 yrs');

const fixture = createServer((req, res) => {
  const target = decodeURIComponent(new URL(req.url, 'http://x').searchParams.get('url') ?? '');
  if (/Blocked/i.test(target)) { res.writeHead(429); return res.end('429 Too Many Requests'); }
  // A profile URL (no search.mp) — serve the seller page the enrichment step fetches.
  if (target && !target.includes('search.mp')) {
    const name = decodeURIComponent(target).replace(/\/$/, '').split('/').pop() ?? 'Supplier';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(profilePage(name));
  }
  if (/Thin/i.test(target)) { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(THIN); }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(GOOD);
});
await new Promise((r) => fixture.listen(FIXTURE_PORT, r));

// ---- point the app at the fixture, and always put it back ------------------
const ENV_PATH = new URL('../.env.local', import.meta.url);
const originalEnvFile = readFileSync(ENV_PATH, 'utf8');
const FIXTURE_ENDPOINT = `http://localhost:${FIXTURE_PORT}/?url={url}&key={key}`;

function setProxyEnv(endpoint, key) {
  let next = originalEnvFile;
  next = next.replace(/^RESEARCH_PROXY_ENDPOINT=.*$/m, `RESEARCH_PROXY_ENDPOINT=${endpoint}`);
  next = next.replace(/^RESEARCH_PROXY_KEY=.*$/m, `RESEARCH_PROXY_KEY=${key}`);
  writeFileSync(ENV_PATH, next);
}

const restore = () => { try { writeFileSync(ENV_PATH, originalEnvFile); } catch {} };
process.on('exit', restore);
process.on('SIGINT', () => { restore(); process.exit(130); });

setProxyEnv(FIXTURE_ENDPOINT, 'fixture');
// Next reloads .env.local on change, but not instantly.
await new Promise((r) => setTimeout(r, 3000));

// ---- setup -----------------------------------------------------------------
const { data: auth, error: authErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr) { console.error('sign in failed:', authErr.message); fixture.close(); process.exit(1); }
const userId = auth.user.id;
const { data: tenant } = await admin.from('tenants').select('id').eq('owner_id', userId).order('created_at').limit(1).single();
const tenantId = tenant.id;

const balance = async () => (await admin.rpc('research_credit_balance', { p_tenant_id: tenantId })).data;

const cleanup = async () => {
  const { data: reqs } = await admin.from('research_report_requests').select('product_idea_id').eq('tenant_id', tenantId);
  for (const r of reqs ?? []) {
    if (r.product_idea_id) {
      const { data: sup } = await admin.from('research_suppliers').select('id').eq('product_idea_id', r.product_idea_id);
      for (const s of sup ?? []) await admin.from('research_price_tiers').delete().eq('supplier_id', s.id);
      await admin.from('evidence').delete().in('subject_id', (sup ?? []).map((x) => x.id));
      await admin.from('research_suppliers').delete().eq('product_idea_id', r.product_idea_id);
      await admin.from('product_ideas').delete().eq('id', r.product_idea_id);
    }
  }
  await admin.from('research_credit_ledger').delete().eq('tenant_id', tenantId);
  await admin.from('research_report_requests').delete().eq('tenant_id', tenantId);
};

await cleanup();

const runWorker = async () => {
  const res = await fetch(`${BASE}/api/research/worker?batch=10`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WORKER_SECRET}` },
  });
  if (!res.ok) return { error: `${res.status} ${await res.text()}` };
  return res.json();
};

console.log('\nOn-demand fulfilment\n');

// Worker must not be open to the public.
const unauth = await fetch(`${BASE}/api/research/worker`, { method: 'POST' });
check('worker rejects unauthenticated callers', unauth.status === 401, `got ${unauth.status}`);

await admin.rpc('grant_research_credits', { p_tenant_id: tenantId, p_amount: 5, p_kind: 'purchase', p_note: 'e2e' });

// ---- 1. happy path ---------------------------------------------------------
await anon.rpc('request_research_report', { p_query: 'Fixture Good Yoga Mat' });
const before = await balance();
let out = await runWorker();
if (out.error) { console.error('worker call failed:', out.error); await cleanup(); fixture.close(); process.exit(1); }

check('delivers a usable report', out.outcomes.delivered === 1, JSON.stringify(out.outcomes));
check('keeps the credit on delivery', (await balance()) === before, `balance ${await balance()} (was ${before})`);

const delivered = out.details.find((d) => d.status === 'delivered');
check('report has 3 suppliers', delivered?.supplierCount === 3, `${delivered?.supplierCount}`);

// The rows must carry real provenance and INR, not defaults.
const { data: sup } = await admin.from('research_suppliers').select('data_source, city, extraction_confidence, audit_report_available').eq('product_idea_id', delivered.productIdeaId);
check('suppliers stamped as scraped', (sup ?? []).every((s) => s.data_source === 'scraped'), `${sup?.length} rows`);
check('evidence booleans left unknown (NULL)', (sup ?? []).every((s) => s.audit_report_available === null));
const { data: tiers } = await admin.from('research_price_tiers').select('currency').in('supplier_id', (await admin.from('research_suppliers').select('id').eq('product_idea_id', delivered.productIdeaId)).data.map((x) => x.id));
check('price tiers are INR', (tiers ?? []).every((t) => t.currency === 'INR'), JSON.stringify([...new Set((tiers ?? []).map((t) => t.currency))]));

// ---- actionability: the whole point of the profile-page fetch ---------------
const { data: enriched } = await admin
  .from('research_suppliers')
  .select('supplier_name, store_url, contact_phone, contact_email, address, certifications, moq, detail_scraped_at, audit_report_available')
  .eq('product_idea_id', delivered.productIdeaId);

check('every supplier has a profile URL', (enriched ?? []).every((s) => s.store_url), `${(enriched ?? []).filter((s) => s.store_url).length}/${enriched?.length}`);
check('every supplier has a phone', (enriched ?? []).every((s) => s.contact_phone === '9876543210'), JSON.stringify((enriched ?? []).map((s) => s.contact_phone)));
check('every supplier has an email', (enriched ?? []).every((s) => (s.contact_email ?? '').includes('@')));
check('every supplier has an address', (enriched ?? []).every((s) => (s.address ?? '').includes('Makarpura')));
check('MOQ now comes from the profile page', (enriched ?? []).every((s) => s.moq === 250), JSON.stringify((enriched ?? []).map((s) => s.moq)));
check('certifications stored as declared strings', (enriched ?? []).every((s) => (s.certifications ?? []).includes('ISO 9001')));
check('certifications did NOT become evidence booleans', (enriched ?? []).every((s) => s.audit_report_available === null));
check('detail_scraped_at recorded', (enriched ?? []).every((s) => s.detail_scraped_at));

// ---- Phase 0: the same observations landed as atomic evidence ---------------
const supplierIds = (await admin.from('research_suppliers').select('id').eq('product_idea_id', delivered.productIdeaId)).data.map((x) => x.id);
const { data: evi } = await admin
  .from('evidence')
  .select('predicate, value, unit, method, parser_version, confidence, ttl_days')
  .in('subject_id', supplierIds);

const predicates = new Set((evi ?? []).map((e) => e.predicate));
check('evidence recorded alongside the supplier row', (evi ?? []).length > 0, `${evi?.length} observations`);
check('contact details captured as evidence', predicates.has('contact_phone') && predicates.has('contact_email'));
check('MOQ captured as evidence', predicates.has('moq'));
check('price carries its quantity break', (evi ?? []).some((e) => e.predicate === 'unit_price' && e.value?.quantity));
check('every observation names its parser', (evi ?? []).every((e) => e.parser_version));
check('TTL varies by predicate (price rots faster than an address)', (() => {
  const price = (evi ?? []).find((e) => e.predicate === 'unit_price');
  const addr = (evi ?? []).find((e) => e.predicate === 'address');
  return price && addr && price.ttl_days < addr.ttl_days;
})());
check('confidence reflects extraction quality, not a constant',
  (evi ?? []).every((e) => e.confidence > 0 && e.confidence <= 1));

// ---- 2. thin result must refund, not charge --------------------------------
await anon.rpc('request_research_report', { p_query: 'Fixture Thin Product' });
const beforeThin = await balance();
out = await runWorker();
check('refuses to deliver a 1-supplier report', out.outcomes.refunded === 1, JSON.stringify(out.outcomes));
check('refunds the credit on a thin result', (await balance()) === beforeThin + 1, `balance ${await balance()} (was ${beforeThin})`);

// ---- 3. blocked source retries, then refunds -------------------------------
await anon.rpc('request_research_report', { p_query: 'Fixture Blocked Product' });
const beforeBlocked = await balance();
let retries = 0;
for (let i = 0; i < 4; i++) {
  out = await runWorker();
  if (out.outcomes.retry) retries++;
  if (out.outcomes.refunded) break;
}
check('retries a 429 before giving up', retries >= 1, `${retries} retries`);
check('refunds after exhausting retries', (await balance()) === beforeBlocked + 1, `balance ${await balance()}`);

// ---- 4. cache hit is served free -------------------------------------------
await anon.rpc('request_research_report', { p_query: 'Fixture Good Yoga Mat' });
const beforeCache = await balance();
out = await runWorker();
const cached = out.details.find((d) => d.fromCache);
check('second request for the same product hits cache', !!cached, JSON.stringify(out.outcomes));
check('cache hit is refunded (customer pays for research, not lookups)', (await balance()) === beforeCache + 1, `balance ${await balance()}`);

await cleanup();
fixture.close();
restore();

console.log(`\n${failures === 0 ? 'Fulfilment verified.' : `${failures} FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
