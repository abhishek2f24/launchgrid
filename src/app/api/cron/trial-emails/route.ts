import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { sendTrialEmail } from '@/lib/emails'

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Day 5 nudge: trial started > 4 days ago (≤ 48h remain)
  const day5Mark = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
  // Day 6 final: trial started > 5 days ago (≤ 24h remain)
  const day6Mark = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()

  // Day 5 email — fires once, guarded by trial_email_day5_sent
  const { data: targets5 } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, trial_expires_at')
    .eq('status', 'trialing')
    .eq('trial_email_day5_sent', false)
    .lt('trial_started_at', day5Mark)

  let sent5 = 0
  for (const sub of (targets5 ?? [])) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, subdomain, users(email)')
      .eq('id', sub.tenant_id)
      .single()

    if (tenant?.users) {
      const userObj = tenant.users as any
      const userEmail = Array.isArray(userObj) ? userObj[0]?.email : userObj?.email

      if (userEmail) {
        const hoursLeft = Math.max(1, Math.round(
          (new Date(sub.trial_expires_at).getTime() - now.getTime()) / (60 * 60 * 1000)
        ))
        await sendTrialEmail(userEmail, tenant.business_name, tenant.subdomain, hoursLeft, 'day5')
        await supabase.from('subscriptions').update({ trial_email_day5_sent: true }).eq('id', sub.id)
        sent5++
      }
    }
  }

  // Day 6 email — fires once, guarded by trial_email_day6_sent
  const { data: targets6 } = await supabase
    .from('subscriptions')
    .select('id, tenant_id, trial_expires_at')
    .eq('status', 'trialing')
    .eq('trial_email_day6_sent', false)
    .lt('trial_started_at', day6Mark)

  let sent6 = 0
  for (const sub of (targets6 ?? [])) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('business_name, subdomain, users(email)')
      .eq('id', sub.tenant_id)
      .single()

    if (tenant?.users) {
      const userObj = tenant.users as any
      const userEmail = Array.isArray(userObj) ? userObj[0]?.email : userObj?.email

      if (userEmail) {
        await sendTrialEmail(userEmail, tenant.business_name, tenant.subdomain, 24, 'day6')
        await supabase.from('subscriptions').update({ trial_email_day6_sent: true }).eq('id', sub.id)
        sent6++
      }
    }
  }

  return NextResponse.json({ ok: true, sentDay5: sent5, sentDay6: sent6 })
}
