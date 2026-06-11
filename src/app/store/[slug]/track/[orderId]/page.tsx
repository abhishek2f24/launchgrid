import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { ShoppingBag, CheckCircle2, Clock, Truck, Home, HelpCircle } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

const serviceSupabase = createServiceClient()

export default async function OrderTrackingPage(props: {
  params: Promise<{ slug: string; orderId: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  // Fetch tenant details to verify subdomain match and get business name
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) notFound()

  // Fetch the order using service client to bypass RLS for public buyers tracking their packages
  const { data: order } = await serviceSupabase
    .from('orders')
    .select('*')
    .eq('id', params.orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (!order) notFound()

  const shortOrderId = order.id.split('-')[0].toUpperCase()
  const isPaid = order.payment_status === 'paid'
  const isShipped = order.fulfillment_status === 'shipped'
  const isDelivered = order.fulfillment_status === 'delivered'

  // Map tracking checkpoints
  const steps = [
    { label: 'Order Placed', desc: 'We have received your order.', active: true, completed: true, icon: <Clock className="w-5 h-5" /> },
    { label: 'Payment Confirmed', desc: isPaid ? 'Payment verified successfully.' : 'Awaiting payment confirmation.', active: true, completed: isPaid, icon: <CheckCircle2 className="w-5 h-5" /> },
    { label: 'Shipped', desc: isShipped ? 'Package is in transit via Delhivery.' : 'Preparing package for courier pickup.', active: isPaid, completed: isShipped || isDelivered, icon: <Truck className="w-5 h-5" /> },
    { label: 'Delivered', desc: isDelivered ? 'Package delivered to destination.' : 'Package is on the way.', active: isShipped, completed: isDelivered, icon: <Home className="w-5 h-5" /> },
  ]

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24">
      <GrainOverlay />
      
      <div className="relative z-10">
        <header className="border-b border-[var(--color-mark-default)] py-5 px-6 md:px-12 flex items-center bg-[var(--color-mark-base)]/80 backdrop-blur-md sticky top-0 z-20">
          <a href={`/store/${params.slug}`} className="text-xs font-black tracking-widest uppercase hover:opacity-85 transition-opacity">
            {tenant.business_name || 'Our Store'}
          </a>
        </header>

        <div className="container mx-auto px-6 md:px-12 py-16 max-w-4xl">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-[var(--color-mark-ink)] mb-3 tracking-tight">Track Your Order</h1>
            <p className="text-xs text-[var(--color-mark-secondary)] font-bold uppercase tracking-widest">
              Order ID: #{shortOrderId} · Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Steps timeline */}
            <div className="lg:col-span-3 bg-white border border-[var(--color-mark-default)] p-8 md:p-10 shadow-sm space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-3">Delivery Progress</h3>
              
              <div className="relative pl-8 border-l-2 border-[var(--color-mark-default)] space-y-12 ml-4">
                {steps.map((step, idx) => {
                  const isCurrent = step.completed && (idx === steps.length - 1 || !steps[idx + 1].completed)
                  return (
                    <div key={step.label} className="relative">
                      {/* Circle icon */}
                      <div className={`absolute -left-[45px] top-0.5 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        step.completed
                          ? 'bg-[var(--color-mark-ink)] text-white border-[var(--color-mark-ink)] shadow-md'
                          : step.active
                          ? 'bg-white text-[var(--color-mark-ink)] border-[var(--color-mark-ink)] animate-pulse'
                          : 'bg-white text-[var(--color-mark-secondary)]/30 border-[var(--color-mark-default)]'
                      }`}>
                        {step.icon}
                      </div>

                      <div>
                        <h4 className={`text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
                          step.completed ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]/50'
                        }`}>
                          {step.label}
                          {isCurrent && (
                            <span className="text-[9px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-150 uppercase tracking-widest animate-pulse">
                              Current Step
                            </span>
                          )}
                        </h4>
                        <p className={`text-xs mt-1 font-medium leading-relaxed ${
                          step.completed ? 'text-[var(--color-mark-secondary)]' : 'text-[var(--color-mark-secondary)]/30'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {isShipped && (
                <div className="pt-4 border-t border-[var(--color-mark-default)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--color-mark-base)] p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="font-bold text-xs text-[var(--color-mark-ink)]">Shipped with Delhivery</h5>
                      <p className="text-[10px] text-[var(--color-mark-secondary)] font-medium mt-0.5">Tracking Number: DELH174982</p>
                    </div>
                  </div>
                  <a
                    href="https://www.delhivery.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[var(--color-mark-ink)] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Track Shipment →
                  </a>
                </div>
              )}
            </div>

            {/* Order summary / customer details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] p-8">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] mb-6">Order Summary</h3>
                <div className="space-y-4 mb-6">
                  {order.line_items?.map((item: any) => (
                    <div key={item.productId || item.id} className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[var(--color-mark-ink)] truncate">{item.title}</p>
                        <p className="text-[10px] text-[var(--color-mark-secondary)] font-semibold uppercase tracking-wider mt-0.5">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-mark-ink)] whitespace-nowrap">₹{(item.price || item.retail_price) * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-[var(--color-mark-default)] my-4" />
                <div className="flex justify-between text-xs text-[var(--color-mark-secondary)] font-medium">
                  <span>Shipping</span>
                  <span className="text-green-700 font-bold uppercase tracking-widest text-[9px]">Free</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-xs text-green-700 font-bold mt-2">
                    <span>Discount Code Applied</span>
                    <span>-₹{order.discount_amount}</span>
                  </div>
                )}
                <div className="h-px bg-[var(--color-mark-default)] my-4" />
                <div className="flex justify-between font-bold text-[var(--color-mark-ink)] items-end">
                  <span className="text-xs uppercase tracking-wider">Total</span>
                  <span className="text-xl font-playfair tracking-tight">₹{order.total_amount}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white border border-[var(--color-mark-default)] p-8 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-2">Shipping Details</h3>
                <div className="text-xs font-medium text-[var(--color-mark-secondary)] space-y-1">
                  <p className="font-bold text-[var(--color-mark-ink)]">{order.customer_name}</p>
                  <p>{order.customer_phone}</p>
                  {order.customer_email && <p>{order.customer_email}</p>}
                  <p className="pt-2">{order.shipping_address?.street}</p>
                  <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}</p>
                </div>
              </div>

              {/* Support */}
              <div className="p-6 border border-dashed border-[var(--color-mark-default)] flex items-start gap-3 bg-white">
                <HelpCircle className="w-5 h-5 text-[var(--color-mark-secondary)]/50 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs text-[var(--color-mark-ink)]">Need help with your order?</h5>
                  <p className="text-[10px] text-[var(--color-mark-secondary)] leading-relaxed mt-1 font-medium">
                    If you have questions about returns, refunds, or delivery delays, reply to your order confirmation mail or reach out to support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
