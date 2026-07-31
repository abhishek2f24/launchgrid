// Creates three fully-set-up demo accounts, one per plan tier, so you can
// log in as each and see exactly what that plan actually unlocks.
//
//   node scripts/seed-plan-demo-accounts.mjs
//
// Each gets a real tenant + business_configs + an ACTIVE (not trialing)
// subscription at that tier, so the dashboard reflects steady-state
// behaviour, not a trial countdown. Safe & idempotent: re-running resets
// password + subscription rather than duplicating anything.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message || error); process.exit(1); } };

const PASSWORD = 'PlanDemo123!';

const ACCOUNTS = [
  { tier: 'free', email: 'plan-free-demo@launchgrid.in', businessName: 'Free Plan Demo Store', subdomain: 'plan-free-demo' },
  { tier: 'starter', email: 'plan-1999-demo@launchgrid.in', businessName: '₹1,999 Plan Demo Store', subdomain: 'plan-1999-demo' },
  { tier: 'pro', email: 'plan-9999-demo@launchgrid.in', businessName: '₹9,999 Plan Demo Store', subdomain: 'plan-9999-demo' },
];

async function ensureAuthUser(email) {
  const existing = await sb.from('users').select('id').eq('email', email).maybeSingle();
  if (existing.data?.id) {
    await sb.auth.admin.updateUserById(existing.data.id, { password: PASSWORD, email_confirm: true });
    return existing.data.id;
  }
  const created = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (created.data?.user) return created.data.user.id;
  if (/already|registered|exist/i.test(created.error?.message || '')) {
    for (let page = 1; page <= 20; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (hit) { await sb.auth.admin.updateUserById(hit.id, { password: PASSWORD, email_confirm: true }); return hit.id; }
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  die(`create auth user (${email})`, created.error || new Error('could not resolve auth user'));
}

async function setupAccount({ tier, email, businessName, subdomain }) {
  const userId = await ensureAuthUser(email);
  die(`upsert public.users (${email})`, (await sb.from('users').upsert({ id: userId, email, full_name: businessName })).error);

  let { data: tenant } = await sb.from('tenants').select('id').eq('owner_id', userId).maybeSingle();
  if (!tenant) {
    const inserted = await sb.from('tenants').insert({
      owner_id: userId, business_name: businessName, subdomain, niche: 'Demo', health_score: 80,
    }).select('id').single();
    die(`create tenant (${email})`, inserted.error);
    tenant = inserted.data;

    die(`business_configs (${email})`, (await sb.from('business_configs').insert({
      tenant_id: tenant.id, whatsapp_number: '+919999999999', shipping_scope: 'inter_state', theme_color: '#6557E8', template_style: 'modern',
      terms_of_service: `Welcome to ${businessName}.`, privacy_policy: `${businessName} respects your privacy.`, refund_policy: '7-day returns.',
      cod_enabled: true,
    })).error);

    die(`tenant_missions (${email})`, (await sb.from('tenant_missions').insert({
      tenant_id: tenant.id, step_1_business: true, step_2_brand: true, step_3_launch: true,
    })).error);
  }

  // Replace any existing subscription with a clean, active one at the target tier.
  await sb.from('subscriptions').delete().eq('tenant_id', tenant.id);
  const farFuture = new Date(Date.now() + 365 * 24 * 3600_000).toISOString();
  die(`subscription (${email})`, (await sb.from('subscriptions').insert({
    tenant_id: tenant.id, plan_tier: tier, billing_cycle: 'monthly', status: 'active',
    trial_started_at: null, trial_expires_at: null, current_period_end: tier === 'free' ? null : farFuture,
  })).error);

  console.log(`✓ ${tier.padEnd(8)} ${email.padEnd(32)} password: ${PASSWORD}  store: ${subdomain}.launchgrid.in`);
}

async function main() {
  for (const account of ACCOUNTS) await setupAccount(account);
  console.log('\nLog in at http://localhost:3000/login with any of the above.');
}

main();
