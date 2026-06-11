import { getActiveTenant } from '@/utils/supabase/queries'
import { createClient } from '@/utils/supabase/server'
import { CouponsPageClient } from './CouponsPageClient'
import { Suspense } from 'react'

export default async function CouponsPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No tenant found.</div>

  const supabase = await createClient()
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('tenant_id', result.tenant.id)
    .order('created_at', { ascending: false })

  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-slate-400">Loading coupons...</div>}>
      <CouponsPageClient initialCoupons={coupons || []} tenantId={result.tenant.id} />
    </Suspense>
  )
}
