import { getActiveTenant, getTenantProducts } from '@/utils/supabase/queries'
import { ProductsPageClient } from './ProductsPageClient'
import { Suspense } from 'react'

export default async function ProductsPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No tenant found.</div>

  const products = await getTenantProducts(result.tenant.id)

  return (
    <Suspense fallback={<div className="p-8 animate-pulse text-slate-400">Loading products...</div>}>
      <ProductsPageClient initialProducts={products} />
    </Suspense>
  )
}
