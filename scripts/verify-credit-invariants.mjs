// Proves the two ways an on-demand credit system leaks money:
//   1. Overspend  — concurrent requests each seeing the same "1 credit left".
//   2. Double-refund — a worker retry handing back the same credit twice.
//
//   node scripts/verify-credit-invariants.mjs
//
// Runs against the real database as a real authenticated user (so RLS and
// auth.uid() are genuinely exercised, not bypassed by the service role), then
// cleans up after itself.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const EMAIL = env.LG_DEMO_EMAIL || 'bulk-demo@launchgrid.in';
const PASSWORD = env.LG_DEMO_PASSWORD || 'BulkDemo123!';

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const { data: auth, error: authErr } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
if (authErr) { console.error('sign in failed:', authErr.message); process.exit(1); }
const userId = auth.user.id;

// Credits are scoped to the ACCOUNT, so every assertion below is about the tenant.
const { data: tenant } = await admin.from('tenants').select('id').eq('owner_id', userId).order('created_at').limit(1).single();
if (!tenant) { console.error('demo user has no tenant'); process.exit(1); }
const tenantId = tenant.id;

const balance = async () => {
  const { data } = await admin.rpc('research_credit_balance', { p_tenant_id: tenantId });
  return data;
};

// Clean slate.
await admin.from('research_credit_ledger').delete().eq('tenant_id', tenantId);
await admin.from('research_report_requests').delete().eq('tenant_id', tenantId);

console.log('\nCredit invariants (account-scoped)\n');

check('starts at zero', (await balance()) === 0, `balance ${await balance()}`);

// A request with no credits must be refused outright.
const { error: brokeErr } = await anon.rpc('request_research_report', { p_query: 'Yoga Mat' });
check('request refused with no credits', !!brokeErr && /credits/i.test(brokeErr.message), brokeErr?.message);

// Grant exactly 2.
await admin.rpc('grant_research_credits', { p_tenant_id: tenantId, p_amount: 2, p_kind: 'purchase', p_note: 'test pack' });
check('purchase credits the account', (await balance()) === 2);

// INVARIANT 1 — fire 5 concurrent requests against a balance of 2.
// A mutable counter would let several of these through; the hold must cap it at 2.
const results = await Promise.all(
  Array.from({ length: 5 }, (_, i) => anon.rpc('request_research_report', { p_query: `Concurrent Probe ${i}` })),
);
const granted = results.filter((r) => !r.error).length;
check('concurrent requests cannot overspend', granted === 2, `${granted} of 5 granted, balance now ${await balance()}`);
check('balance floored at zero', (await balance()) === 0);

const requestIds = results.filter((r) => !r.error).map((r) => r.data);

// INVARIANT 2 — refund the same request twice; the credit must come back once.
await admin.rpc('refund_research_request', { p_request_id: requestIds[0], p_reason: 'quality gate failed' });
const afterFirst = await balance();
await admin.rpc('refund_research_request', { p_request_id: requestIds[0], p_reason: 'retry' });
const afterSecond = await balance();
check('refund returns the credit', afterFirst === 1, `balance ${afterFirst}`);
check('double refund is a no-op', afterSecond === 1, `balance ${afterSecond}`);

// A customer must not be able to mint credits directly.
const { error: mintErr } = await anon.from('research_credit_ledger').insert({ user_id: userId, tenant_id: tenantId, kind: 'purchase', delta: 999, note: 'self-serve' });
check('client cannot insert ledger rows', !!mintErr, mintErr?.message?.slice(0, 60));

// ...nor forge a request row that skips the hold.
const { error: forgeErr } = await anon.from('research_report_requests').insert({ user_id: userId, tenant_id: tenantId, requested_query: 'free', normalized_query: 'free' });
check('client cannot insert request rows', !!forgeErr, forgeErr?.message?.slice(0, 60));

// Customers can still read their own history.
const { data: mine, error: readErr } = await anon.from('research_report_requests').select('id');
check('client can read own requests', !readErr && Array.isArray(mine), `${mine?.length} rows`);

await admin.from('research_credit_ledger').delete().eq('tenant_id', tenantId);
await admin.from('research_report_requests').delete().eq('tenant_id', tenantId);

console.log(`\n${failures === 0 ? 'All invariants hold.' : `${failures} FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
