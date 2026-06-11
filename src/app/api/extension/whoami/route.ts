import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

const serviceSupabase = createServiceClient()

export async function GET(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user

  if (!user) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      user = (await supabase.auth.getUser(token)).data.user
    }
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  console.log('[whoami] User ID:', user.id)

  const { data: tenant, error: tenantErr } = await serviceSupabase
    .from('tenants')
    .select('id, subdomain, business_name')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  console.log('[whoami] Tenant fetch:', { tenant, tenantErr })

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

  const { count } = await serviceSupabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  return NextResponse.json({
    store_name:    tenant.business_name ?? '',
    subdomain:     tenant.subdomain ?? '',
    product_count: count ?? 0,
  })
}
