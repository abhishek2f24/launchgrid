import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { resolveRequestClient } from '@/utils/supabase/bearer'
import { getResearchReportWithClient } from '@/actions/research'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  const cookieClient = await createClient()
  const { supabase, user } = await resolveRequestClient(req, cookieClient)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ideaId } = await params

  try {
    const report = await getResearchReportWithClient(supabase, user, ideaId)
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

    // Resolve user plan tier to enforce server-side paywall
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    let planTier = 'free'
    if (tenant) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan_tier')
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .maybeSingle()
      if (sub?.plan_tier) planTier = sub.plan_tier
    }

    // Server-side paywall. Stripping here rather than hiding in the client is the whole
    // point: a blur is a CSS effect, and any HTTP client can read the raw response.
    //
    // opportunityScore / landedCosts / profitability are stripped too. Withholding only
    // the cockpit still hands a free user the score and the landed cost — the two
    // numbers merchants actually buy the report for.
    const LOCKED_FOR_FREE = [
      'decisionCockpit',
      'sourcingScenarios',
      'opportunityScore',
      'landedCosts',
      'profitability',
    ] as const

    const isLocked = planTier === 'free'
    if (isLocked) {
      for (const field of LOCKED_FOR_FREE) {
        delete (report as Record<string, unknown>)[field]
      }
    }

    // Suppliers and the idea itself stay visible — that preview is what motivates the
    // upgrade. `locked` lets the app show a real upgrade prompt instead of a screen
    // with unexplained gaps.
    return NextResponse.json({
      data: {
        ...report,
        locked: {
          isLocked,
          fields: isLocked ? [...LOCKED_FOR_FREE] : [],
          reason: isLocked ? 'Upgrade to see the full decision report' : null,
        },
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
