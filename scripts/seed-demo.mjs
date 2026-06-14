// Seed an isolated DEMO store into the live Supabase, for Play Store screenshots.
//
//   node scripts/seed-demo.mjs <email> <password>
//   (or set DEMO_EMAIL / DEMO_PASSWORD env vars)
//
// Safe & reversible: everything hangs off one fixed tenant id (DEMO.TENANT_ID).
// Re-running wipes & re-inserts only that tenant's rows. `teardown-demo.mjs`
// removes it entirely. No other tenant is read or written.
//
// Uses the service-role REST API over verified HTTPS (no direct DB, no TLS
// shortcuts). Requires the orders.payment_method column (migration 0021).

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { DEMO, PRODUCTS, ORDERS, productId, orderId, VISITORS_TODAY } from './demo-data.mjs';

// ---- env ----
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
const iso = (hoursAgo) => new Date(Date.now() - hoursAgo * 3600_000).toISOString();

async function ensureAuthUser() {
  // Re-run path: public.users already maps email -> auth id.
  const existing = await sb.from('users').select('id').eq('email', DEMO.EMAIL).maybeSingle();
  if (existing.data?.id) {
    await sb.auth.admin.updateUserById(existing.data.id, { password: DEMO.PASSWORD, email_confirm: true });
    console.log(`• auth user reused (${DEMO.EMAIL})`);
    return existing.data.id;
  }
  const created = await sb.auth.admin.createUser({ email: DEMO.EMAIL, password: DEMO.PASSWORD, email_confirm: true });
  if (created.data?.user) { console.log(`• auth user created (${DEMO.EMAIL})`); return created.data.user.id; }

  // Already in auth but not in public.users (partial prior run): find by paging.
  if (/already|registered|exist/i.test(created.error?.message || '')) {
    for (let page = 1; page <= 20; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((u) => u.email?.toLowerCase() === DEMO.EMAIL.toLowerCase());
      if (hit) {
        await sb.auth.admin.updateUserById(hit.id, { password: DEMO.PASSWORD, email_confirm: true });
        console.log(`• auth user found & password reset (${DEMO.EMAIL})`);
        return hit.id;
      }
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  die('create auth user', created.error || new Error('could not resolve auth user'));
}

async function wipeTenantChildren() {
  // order_items via FK to demo orders; then the rest. Order matters for FKs.
  const oids = ORDERS.map((o) => orderId(o.n));
  await sb.from('order_items').delete().in('order_id', oids);
  for (const t of ['orders', 'store_events', 'products', 'business_configs', 'subscriptions', 'tenant_missions']) {
    const col = t === 'store_events' ? 'store_id' : 'tenant_id';
    const { error } = await sb.from(t).delete().eq(col, DEMO.TENANT_ID);
    if (error && !/does not exist|no rows/i.test(error.message)) die(`wipe ${t}`, error);
  }
}

async function main() {
  console.log(`\nSeeding demo store "${DEMO.BUSINESS_NAME}" → tenant ${DEMO.TENANT_ID}\n`);

  const ownerId = await ensureAuthUser();

  die('upsert users', (await sb.from('users').upsert(
    { id: ownerId, email: DEMO.EMAIL, full_name: DEMO.FULL_NAME, phone: DEMO.PHONE }, { onConflict: 'id' },
  )).error);

  die('upsert tenant', (await sb.from('tenants').upsert({
    id: DEMO.TENANT_ID, owner_id: ownerId, business_name: DEMO.BUSINESS_NAME,
    subdomain: DEMO.SUBDOMAIN, niche: DEMO.NICHE, health_score: 82, is_active: true,
  }, { onConflict: 'id' })).error);

  await wipeTenantChildren();

  die('business_configs', (await sb.from('business_configs').upsert({
    tenant_id: DEMO.TENANT_ID, payment_tier: 'free_upi', merchant_upi_id: 'aanya@okhdfcbank',
    whatsapp_number: DEMO.PHONE, shipping_scope: 'inter_state', state: 'Maharashtra',
    theme_color: '#7C3AED', template_style: 'modern', tagline: 'Handpicked ethnic wear, delivered across India',
    hero_subtitle: 'Festive-ready outfits & handcrafted accessories', gstin: '27ABCDE1234F1Z5', gst_rate: 5,
  }, { onConflict: 'tenant_id' })).error);

  die('subscriptions', (await sb.from('subscriptions').insert({
    tenant_id: DEMO.TENANT_ID, plan_tier: 'pro', billing_cycle: 'monthly', status: 'active',
    current_period_end: new Date(Date.now() + 30 * 86400_000).toISOString(),
  })).error);

  die('tenant_missions', (await sb.from('tenant_missions').insert({
    tenant_id: DEMO.TENANT_ID, step_1_business: true, step_2_brand: true, step_3_launch: true,
    step_4_payments: true, step_8_first_visitor: true, step_10_first_order: true, step_11_delivered: true,
  })).error);

  die('products', (await sb.from('products').insert(PRODUCTS.map((p) => ({
    id: productId(p.n), tenant_id: DEMO.TENANT_ID, title: p.title,
    slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    retail_price: p.price, compare_at_price: p.compare, cost_price: Math.round(p.price * 0.55),
    stock: p.stock, is_active: p.active, image_urls: p.img, description: p.desc, source: 'manual',
  })))).error);

  const priceOf = (n) => PRODUCTS.find((p) => p.n === n).price;
  const orderRows = ORDERS.map((o) => ({
    id: orderId(o.n), tenant_id: DEMO.TENANT_ID, customer_name: o.name, customer_phone: o.phone,
    customer_email: o.email, total_amount: o.items.reduce((s, it) => s + priceOf(it.p) * it.q, 0),
    payment_status: o.pay, fulfillment_status: o.fulfill, payment_method: o.method,
    created_at: iso(o.hoursAgo), shipping_address: o.ship,
  }));
  die('orders', (await sb.from('orders').insert(orderRows)).error);

  const itemRows = ORDERS.flatMap((o) => o.items.map((it) => ({
    order_id: orderId(o.n), product_id: productId(it.p), quantity: it.q, price_at_purchase: priceOf(it.p),
  })));
  die('order_items', (await sb.from('order_items').insert(itemRows)).error);

  const events = Array.from({ length: VISITORS_TODAY }, (_, i) => ({
    store_id: DEMO.TENANT_ID, event_type: 'page_view',
    session_id: `demo-sess-${i}`, created_at: iso((i % 9) + (i % 60) / 60),
  }));
  die('store_events', (await sb.from('store_events').insert(events)).error);

  const todayRevenue = orderRows.filter((o) => ORDERS.find((x) => orderId(x.n) === o.id).hoursAgo < 24)
    .reduce((s, o) => s + o.total_amount, 0);

  console.log(`\n✓ Demo store seeded.
  Login email   : ${DEMO.EMAIL}
  Login password: ${DEMO.PASSWORD}
  Store         : ${DEMO.BUSINESS_NAME}  (${DEMO.SUBDOMAIN}.launchgrid.in)
  Plan          : Get Customers (pro)
  Products      : ${PRODUCTS.length}   Orders: ${ORDERS.length}   Today's visitors: ${VISITORS_TODAY}
  Today strip   : ₹${todayRevenue.toLocaleString('en-IN')} revenue · ${orderRows.filter((o)=>ORDERS.find(x=>orderId(x.n)===o.id).hoursAgo<24).length} orders · ${VISITORS_TODAY} visitors
  Tenant id     : ${DEMO.TENANT_ID}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
