import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export async function GET(request: Request) {
  try {
    // Security check: Vercel sends this header on cron queries
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('subscriptions')
      .update({ status: 'archived' })
      .eq('status', 'trialing')
      .lt('trial_expires_at', now)
      .select('id, tenant_id')

    if (error) {
      console.error('[CRON_ARCHIVE_TRIALS_ERROR]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[CRON_ARCHIVE_TRIALS] Archived ${data?.length ?? 0} expired trials`)
    return NextResponse.json({ archived: data?.length ?? 0 })
  } catch (err: any) {
    console.error('[CRON_ARCHIVE_TRIALS_CRITICAL]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
export const dynamic = 'force-dynamic'
export const revalidate = 0
