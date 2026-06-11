import { getActiveTenant, getTenantOrders } from '@/utils/supabase/queries'
import { Users, Mail, Phone, ExternalLink } from 'lucide-react'
import { CustomersGuideClient } from './CustomersGuideClient'

export default async function CustomersPage() {
  const result = await getActiveTenant()
  
  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const orders = await getTenantOrders(tenant.id)
  
  // Extract unique customers from orders
  const customersMap = new Map()
  orders.forEach(order => {
    const key = order.customer_email || order.customer_phone
    if (!key) return
    
    if (!customersMap.has(key)) {
      customersMap.set(key, {
        name: order.customer_name,
        email: order.customer_email,
        phone: order.customer_phone,
        total_spend: 0,
        order_count: 0,
        last_order_date: order.created_at
      })
    }
    
    const customer = customersMap.get(key)
    customer.total_spend += Number(order.total_amount)
    customer.order_count += 1
    if (new Date(order.created_at) > new Date(customer.last_order_date)) {
      customer.last_order_date = order.created_at
    }
  })

  const customers = Array.from(customersMap.values())

  const config = tenant.business_configs?.[0] || {}
  const hasWhatsApp = !!config.whatsapp_number
  const whatsappNumber = config.whatsapp_number

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2">Customers.</h1>
          <p className="text-sm text-[var(--color-mark-secondary)]">Manage your customer relationships and lifetime value.</p>
        </div>
      </div>

      {customers.length === 0 ? (
        <CustomersGuideClient hasWhatsApp={hasWhatsApp} whatsappNumber={whatsappNumber} />
      ) : (
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02]">
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Customer</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Contact</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Total Spend</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest text-right">Orders</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-[var(--color-mark-ink)] text-sm flex items-center gap-2">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-mark-secondary)] mt-0.5 font-medium">
                      Last active {new Date(c.last_order_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-mark-secondary)]">
                        <Mail className="w-3 h-3" /> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-[var(--color-mark-secondary)]">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-sm font-bold text-[var(--color-mark-ink)]">
                    ₹{c.total_spend}
                  </td>
                  <td className="p-4 text-right">
                    <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-black/5 rounded-md text-xs font-bold text-[var(--color-mark-ink)]">
                      {c.order_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
