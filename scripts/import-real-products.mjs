// Imports REAL products by running each URL through the app's actual live importer
// (/api/products/fetch-url) — the same code path the dashboard "Import from URL" tab and
// the Chrome extension's sourcing flow rely on.
//
//   node scripts/import-real-products.mjs /tmp/real_urls.json
//
// Unlike scripts/seed-bulk-catalog-research.mjs, NOTHING here is synthesised:
// title, price and images all come from the live marketplace listing.
//
// LIMITS, stated plainly:
//   • Marketplaces rate-limit and bot-block. This runs sequentially with a delay and will
//     report failures rather than silently substituting made-up values.
//   • A retail listing gives RETAIL data only. It does NOT contain supplier MOQ, factory
//     audit status, business-licence evidence or wholesale unit price — those live on
//     Alibaba/IndiaMART supplier pages and are what the research module actually needs.
//     So this script builds a real CATALOGUE; it deliberately does not fabricate a
//     research report on top of it.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const BASE = process.env.LG_BASE_URL || 'http://localhost:3000';
const SUBDOMAIN = 'real-demo';
const OWNER_EMAIL = 'real-demo@launchgrid.in';
const OWNER_PASSWORD = 'RealDemo123!';
const BUSINESS_NAME = 'RealSourced Store';
const MARGIN_MULTIPLIER = 1.6; // retail markup applied over the sourced listing price

const urlsFile = process.argv[2];
if (!urlsFile) { console.error('usage: node scripts/import-real-products.mjs <urls.json>'); process.exit(1); }
const urls = JSON.parse(readFileSync(urlsFile, 'utf8'));

const sha = (s) => createHash('sha256').update(s).digest('hex');
const fixedUuid = (seed) => {
  const hex = sha(seed);
  return [hex.slice(0, 8), hex.slice(8, 12), '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20), hex.slice(20, 32)].join('-');
};
const slugify = (n) => n.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 60);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message || error); process.exit(1); } };

async function ensureOwner() {
  const existing = await sb.from('users').select('id').eq('email', OWNER_EMAIL).maybeSingle();
  if (existing.data?.id) return existing.data.id;
  const created = await sb.auth.admin.createUser({ email: OWNER_EMAIL, password: OWNER_PASSWORD, email_confirm: true, user_metadata: { full_name: BUSINESS_NAME } });
  if (created.data?.user) return created.data.user.id;
  for (let page = 1; page <= 20; page++) {
    const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    const hit = data?.users?.find((u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());
    if (hit) return hit.id;
    if (!data?.users?.length || data.users.length < 200) break;
  }
  die('create owner', created.error || new Error('could not resolve owner'));
}

/** Real sign-in — the importer is an authenticated endpoint, so authenticate for real. */
async function getAccessToken() {
  const { data, error } = await sb.auth.signInWithPassword({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
  if (error || !data.session) die('sign in', error || new Error('no session returned'));
  return data.session.access_token;
}

async function main() {
  const userId = await ensureOwner();
  die('users', (await sb.from('users').upsert({ id: userId, email: OWNER_EMAIL, full_name: BUSINESS_NAME })).error);

  const tenantId = fixedUuid('tenant-' + SUBDOMAIN);
  die('tenant', (await sb.from('tenants').upsert({ id: tenantId, owner_id: userId, business_name: BUSINESS_NAME, subdomain: SUBDOMAIN, niche: 'General Store' })).error);
  die('config', (await sb.from('business_configs').upsert({ tenant_id: tenantId, shipping_scope: 'inter_state', theme_color: 'emerald', template_style: 'minimal', cod_enabled: true, whatsapp_number: '919999999999' })).error);
  die('subscription', (await sb.from('subscriptions').upsert({ id: fixedUuid('sub-' + SUBDOMAIN), tenant_id: tenantId, plan_tier: 'premium', status: 'active', billing_cycle: 'monthly' }, { onConflict: 'id' })).error);

  const accessToken = await getAccessToken();
  console.log(`\nImporting ${urls.length} REAL listings through ${BASE}/api/products/fetch-url\n`);

  const rows = [];
  let ok = 0, failed = 0, partial = 0;

  for (const [i, url] of urls.entries()) {
    const label = `[${String(i + 1).padStart(3)}/${urls.length}]`;
    try {
      const res = await fetch(`${BASE}/api/products/fetch-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) { failed++; console.log(`${label} ✗ HTTP ${res.status}  ${url.slice(0, 70)}`); continue; }
      const d = await res.json();

      if (!d.title || !d.price) {
        partial++;
        console.log(`${label} ⚠ incomplete (title=${!!d.title} price=${d.price ?? 'null'} imgs=${(d.images || []).length}) — skipped, NOT faked`);
        continue;
      }

      const retail = Math.round((d.price * MARGIN_MULTIPLIER) / 10) * 10 - 1;
      rows.push({
        id: fixedUuid('realproduct-' + url),
        tenant_id: tenantId,
        title: d.title.slice(0, 180),
        slug: `${slugify(d.title)}-${sha(url).slice(0, 5)}`,
        description: (d.description || d.title).slice(0, 800),
        retail_price: retail,
        cost_price: d.price,            // the ACTUAL listed price on the source marketplace
        image_urls: (d.images || []).slice(0, 6), // ACTUAL product photos from the listing
        is_active: true,
        source: 'url_import',
        source_url: d.source_url || url,
        stock: 50,
        metadata: { imported_from: d.source_site, listed_price: d.price, real_import: true },
      });
      ok++;
      console.log(`${label} ✓ ₹${String(d.price).padStart(6)} → ₹${String(retail).padStart(6)}  ${(d.images || []).length} imgs  ${d.title.slice(0, 52)}`);
    } catch (err) {
      failed++;
      console.log(`${label} ✗ ${err.message}`);
    }
    await sleep(700); // be a polite client — don't hammer the marketplace
  }

  if (rows.length) {
    for (let i = 0; i < rows.length; i += 100) {
      die('upsert products', (await sb.from('products').upsert(rows.slice(i, i + 100))).error);
    }
  }

  console.log(`\n──────── REAL IMPORT SUMMARY ────────`);
  console.log(`  imported : ${ok}`);
  console.log(`  incomplete (skipped, not faked): ${partial}`);
  console.log(`  failed   : ${failed}`);
  console.log(`\n  Login:      ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`  Storefront: ${BASE}/store/${SUBDOMAIN}/shop`);
}

main();
