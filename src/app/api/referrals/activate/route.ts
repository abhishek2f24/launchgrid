/**
 * POST /api/referrals/activate
 *
 * Called when a referred user completes their first paid subscription.
 * 1. Looks up the tenant for the given userId
 * 2. Flips referrals.status  pending → paid  (using referred_tenant_id, not referred_user_id)
 * 3. Credits 7 free days to the referrer's subscription (referral_credit_days += 7)
 *
 * Body: { userId: string }  ← the paying user's Supabase auth user_id
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

const CREDIT_DAYS_PER_REFERRAL = 7

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // ── Step 0: Resolve userId → tenantId ────────────────────────────────────
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (!tenant) {
      return NextResponse.json({ status: 'no_tenant_found' })
    }

    // ── Step 1: Find the pending referral for this tenant ────────────────────
    const { data: referral, error: findErr } = await supabase
      .from('referrals')
      .select('id, referrer_tenant_id, status')
      .eq('referred_tenant_id', tenant.id)
      .eq('status', 'pending')
      .single()

    if (findErr || !referral) {
      // Not an error — user simply wasn't referred or was already activated
      return NextResponse.json({ status: 'no_pending_referral' })
    }

    // ── Step 2: Flip status to 'paid' ─────────────────────────────────────────
    const { error: updateErr } = await supabase
      .from('referrals')
      .update({ status: 'paid', activated_at: new Date().toISOString() })
      .eq('id', referral.id)

    if (updateErr) throw updateErr

    // ── Step 3: Credit free days to referrer's subscription ──────────────────
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, referral_credit_days')
      .eq('tenant_id', referral.referrer_tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sub) {
      const currentDays = sub.referral_credit_days ?? 0
      await supabase
        .from('subscriptions')
        .update({ referral_credit_days: currentDays + CREDIT_DAYS_PER_REFERRAL })
        .eq('id', sub.id)
    } else {
      // Referrer has no subscription yet — store pending credit on the referral row
      await supabase
        .from('referrals')
        .update({ pending_credit_days: CREDIT_DAYS_PER_REFERRAL })
        .eq('id', referral.id)
    }

    console.log(`[REFERRAL_ACTIVATE] userId=${userId} tenantId=${tenant.id} → referrer tenant=${referral.referrer_tenant_id} → +${CREDIT_DAYS_PER_REFERRAL} days`)

    return NextResponse.json({
      success: true,
      referrerTenantId: referral.referrer_tenant_id,
      creditDaysGranted: CREDIT_DAYS_PER_REFERRAL,
    })
  } catch (err: any) {
    console.error('[REFERRAL_ACTIVATE_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
