import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { rateLimit, getClientIp } from '@/utils/rateLimit'

const supabase = createServiceClient()

export async function POST(req: Request) {
  // Rate limit: 10 referral records per IP per minute
  const ip = getClientIp(req)
  const rl = rateLimit(`referrals-record:${ip}`, { limit: 10, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { refCode, newUserId } = await req.json()
    if (!refCode || !newUserId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Find the referrer tenant
    const { data: referrer } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', refCode)
      .single()

    if (!referrer) {
      return NextResponse.json({ status: 'no_referrer' })
    }

    // Upsert referral record (idempotent — don't double-credit same user)
    const { error } = await supabase
      .from('referrals')
      .upsert({
        referrer_tenant_id: referrer.id,
        referred_user_id: newUserId,
        referrer_code: refCode,
        status: 'pending', // upgrades to 'paid' when referred user pays subscription
      }, {
        onConflict: 'referred_user_id',
        ignoreDuplicates: true,
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[REFERRAL_RECORD_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
