import { getActiveTenant } from '@/utils/supabase/queries'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, ShoppingBag, ShieldCheck } from 'lucide-react'
import { OrderActionsClient } from './OrderActionsClient'

export default async function OrderDetailPage(props: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await props.params
  const result = await getActiveTenant()

  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const supabase = await createClient()

  // Fetch the order, verifying tenant ownership
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, order_items(*, products(*))')
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (error || !order) {
    return notFound()
  }

  const address = order.shipping_address || {}
  const lineItems = order.line_items || []
  const shortOrderId = order.id.split('-')[0].toUpperCase()

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="p-8 max-w-5xl mx-auto font-inter space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="p-2 border border-black/5 bg-white rounded-xl shadow-sm text-[var(--color-mark-secondary)] hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-playfair text-[var(--color-mark-ink)]">Order Details</h1>
            <span className="text-xs font-mono font-bold text-[var(--color-mark-secondary)] bg-black/5 px-2 py-0.5 rounded">
              #{shortOrderId}
            </span>
          </div>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products Summary */}
          <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4">
              <ShoppingBag className="w-5 h-5 text-[var(--color-mark-ink)]" />
              <h2 className="text-base font-bold text-[var(--color-mark-ink)]">Items Summary</h2>
            </div>
            
            <div className="divide-y divide-black/5">
              {lineItems.map((item: any, idx: number) => {
                const title = item.title || item.productName || 'Product Item'
                const price = Number(item.retail_price || item.price || 0)
                const qty = Number(item.quantity || 1)
                const total = price * qty
                const image = item.image || item.image_url

                return (
                  <div key={idx} className="flex gap-4 py-4.5 first:pt-0 last:pb-0">
                    <div className="w-16 h-20 bg-black/5 rounded-xl overflow-hidden shrink-0 border border-black/5">
                      {image ? (
                        <img src={image} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black/30">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-mark-ink)] truncate">{title}</p>
                      <p className="text-xs text-[var(--color-mark-secondary)] mt-1">
                        ₹{price} × {qty}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[var(--color-mark-ink)] font-mono">
                      ₹{total}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="border-t border-black/5 pt-5 flex flex-col items-end">
              <div className="w-64 space-y-2 text-xs text-[var(--color-mark-secondary)]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{order.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold uppercase tracking-widest text-[9px]">Free</span>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-3 text-sm font-black text-[var(--color-mark-ink)] uppercase">
                  <span>Total</span>
                  <span className="font-mono text-base">₹{order.total_amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Address Details */}
          <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-black/5 pb-4">
              <User className="w-5 h-5 text-[var(--color-mark-ink)]" />
              <h2 className="text-base font-bold text-[var(--color-mark-ink)]">Customer Profile</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[var(--color-mark-secondary)]">
                  <User className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Full Name</p>
                    <p className="font-bold text-[var(--color-mark-ink)]">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[var(--color-mark-secondary)]">
                  <Phone className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Phone Number</p>
                    <p className="font-bold text-[var(--color-mark-ink)]">{order.customer_phone}</p>
                  </div>
                </div>
                {order.customer_email && (
                  <div className="flex items-center gap-3 text-[var(--color-mark-secondary)]">
                    <Mail className="w-4 h-4 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Email Address</p>
                      <p className="font-bold text-[var(--color-mark-ink)]">{order.customer_email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 text-[var(--color-mark-secondary)] border-t md:border-t-0 md:border-l border-black/5 pt-4 md:pt-0 md:pl-6">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1">Shipping Address</p>
                  <div className="space-y-0.5 font-medium leading-relaxed text-[var(--color-mark-ink)]">
                    <p>{address.street || ''}</p>
                    <p>{address.city || ''}{address.state ? `, ${address.state}` : ''}</p>
                    <p className="font-bold font-mono text-xs">{address.pincode || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Actions Console */}
        <div className="space-y-6">
          <OrderActionsClient 
            orderId={order.id}
            initialPaymentStatus={order.payment_status}
            initialFulfillmentStatus={order.fulfillment_status}
            subdomain={tenant.subdomain}
          />
        </div>
      </div>
    </div>
  )
}
