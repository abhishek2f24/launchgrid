import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

const serviceSupabase = createServiceClient()

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch tenant
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })

    // Fetch orders to calculate customer count
    const { data: orders } = await serviceSupabase
      .from('orders')
      .select('customer_email, customer_phone')
      .eq('tenant_id', tenant.id)

    const customersSet = new Set()
    orders?.forEach(order => {
      const key = order.customer_email || order.customer_phone
      if (key) customersSet.add(key)
    })

    return NextResponse.json({ customerCount: customersSet.size })
  } catch (err: any) {
    console.error('[MARKETING_STATS_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
