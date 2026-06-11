import { getActiveTenant, getTenantOrders, getTenantProductCount } from '@/utils/supabase/queries'
import { PanicStateModal } from '@/components/dashboard/PanicStateModal'
import { OrdersChecklistClient } from './OrdersChecklistClient'
import { OrdersListClient } from './OrdersListClient'

export default async function OrdersPage() {
  const result = await getActiveTenant()
  
  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const orders = await getTenantOrders(tenant.id)
  const productCount = await getTenantProductCount(tenant.id)
  
  // Find if there is an unfulfilled first order to trigger the Panic Modal
  const unfulfilledFirstOrder = orders.find(o => o.fulfillment_status === 'unfulfilled')
  const hasFirstOrder = !!unfulfilledFirstOrder

  const config = tenant.business_configs?.[0] || {}
  const hasPayments = !!(config.merchant_upi_id || config.rzp_key_id)
  const hasProducts = productCount > 0
  const storeUrl = `https://${tenant.subdomain}.launchgrid.in`

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter relative">
      {hasFirstOrder && <PanicStateModal order={unfulfilledFirstOrder} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2">Orders.</h1>
          <p className="text-sm text-[var(--color-mark-secondary)]">Manage fulfillments and customer payments.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <OrdersChecklistClient
          hasPayments={hasPayments}
          hasProducts={hasProducts}
          productCount={productCount}
          storeUrl={storeUrl}
        />
      ) : (
        <OrdersListClient initialOrders={orders} />
      )}
    </div>
  )
}
