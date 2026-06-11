import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getPlan } from '@/lib/plans'

/**
 * GET /api/v1/entitlements
 * Single entitlement source for web + mobile. Auth: session cookie or Bearer.
 */
export async function GET(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user
  if (!user) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) user = (await supabase.auth.getUser(token)).data.user
  }
  if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 })

  const service = createServiceClient()
  const { data: tenant } = await service
    .from('tenants')
    .select('id, business_name, subdomain, subscriptions(plan_tier, status, current_period_end)')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (!tenant) return NextResponse.json({ data: null, error: { code: 'NO_TENANT', message: 'No store found' } }, { status: 404 })

  const sub = (tenant.subscriptions || [])[0] || {}
  const plan = getPlan(sub.plan_tier)

  const { count: productCount } = await service
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  return NextResponse.json({
    data: {
      tenant_id: tenant.id,
      store_name: tenant.business_name,
      subdomain: tenant.subdomain,
      plan: {
        tier: sub.plan_tier || 'starter',
        public_name: plan.publicName,
        status: sub.status || 'active',
        current_period_end: sub.current_period_end || null,
      },
      features: plan.features,
      limits_used: { products: productCount ?? 0 },
    },
    error: null,
  })
}
