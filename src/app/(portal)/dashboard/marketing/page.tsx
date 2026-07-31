import { getActiveTenant, getTenantProducts } from '@/utils/supabase/queries'
import { MarketingPageClient } from './MarketingPageClient'

export default async function MarketingPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No store found.</div>

  const products = await getTenantProducts(result.tenant.id)

  return <MarketingPageClient initialProducts={products || []} />
}
