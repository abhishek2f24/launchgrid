// Remove the DEMO store seeded by seed-demo.mjs. Deletes ONLY DEMO.TENANT_ID
// and its rows (cascades), then the demo auth user. No other tenant touched.
//
//   node scripts/teardown-demo.mjs            (keeps the auth login)
//   node scripts/teardown-demo.mjs --auth     (also deletes the auth user)

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { DEMO, ORDERS, orderId } from './demo-data.mjs';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const alsoAuth = process.argv.includes('--auth');
  console.log(`\nRemoving demo tenant ${DEMO.TENANT_ID}…`);

  await sb.from('order_items').delete().in('order_id', ORDERS.map((o) => orderId(o.n)));
  await sb.from('store_events').delete().eq('store_id', DEMO.TENANT_ID);
  // tenants delete cascades to orders/products/business_configs/subscriptions/tenant_missions.
  const { error } = await sb.from('tenants').delete().eq('id', DEMO.TENANT_ID);
  if (error) { console.error('✗ delete tenant:', error.message); process.exit(1); }
  console.log('✓ tenant + cascaded rows removed');

  if (alsoAuth) {
    const { data } = await sb.from('users').select('id').eq('email', DEMO.EMAIL).maybeSingle();
    let uid = data?.id;
    if (!uid) {
      const list = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
      uid = list.data?.users?.find((u) => u.email?.toLowerCase() === DEMO.EMAIL.toLowerCase())?.id;
    }
    if (uid) { await sb.auth.admin.deleteUser(uid); console.log(`✓ auth user removed (${DEMO.EMAIL})`); }
    else console.log('• auth user not found (already gone)');
  } else {
    console.log('• auth login kept (pass --auth to remove it too)');
  }
  console.log('');
}

main().catch((e) => { console.error(e); process.exit(1); });
