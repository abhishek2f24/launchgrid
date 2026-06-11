import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { PrintInvoiceButton } from '@/components/store/PrintInvoiceButton'

interface PageProps {
  params: Promise<{ slug: string; orderId: string }>
}

export default async function StoreInvoicePage(props: PageProps) {
  const { slug, orderId } = await props.params

  const supabase = createServiceClient()

  // 1. Fetch tenant details and business config (including merchant state, gst_rate, gstin)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, subdomain, custom_domain, business_configs(state, gst_rate, gstin)')
    .eq('subdomain', slug)
    .single()

  if (!tenant) {
    return notFound()
  }

  // 2. Fetch order details, verifying tenant_id match
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('tenant_id', tenant.id)
    .single()

  if (!order) {
    return notFound()
  }

  // Parse address details safely
  const address = order.shipping_address || {}
  const items = order.line_items || []

  // Determine state comparison and calculate CGST/SGST vs IGST splits (C-05 / CR-01)
  const buyerState = address.state || ''
  const merchantConfigs = tenant.business_configs || []
  const config = Array.isArray(merchantConfigs) ? merchantConfigs[0] : merchantConfigs
  const merchantState = (config as any)?.state || 'Maharashtra'
  const gstRate = Number((config as any)?.gst_rate ?? 18)
  const gstin = (config as any)?.gstin || null
  const halfGst = gstRate / 2

  const isInterState = buyerState && merchantState && buyerState.toLowerCase().trim() !== merchantState.toLowerCase().trim()

  const totalAmount = Number(order.total_amount)
  const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2))

  let cgst = 0
  let sgst = 0
  let igst = 0

  if (isInterState) {
    igst = Number(((subtotal * gstRate) / 100).toFixed(2))
  } else {
    cgst = Number(((subtotal * halfGst) / 100).toFixed(2))
    sgst = Number(((subtotal * halfGst) / 100).toFixed(2))
  }

  // Rounding adjustments
  const taxSum = Number((cgst + sgst + igst).toFixed(2))
  const roundingAdjustment = Number((totalAmount - (subtotal + taxSum)).toFixed(2))

  const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-screen bg-neutral-50 py-10 px-4 sm:px-6 lg:px-8 font-inter">
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between no-print bg-white p-4 border border-black/5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-600" />
          <span className="text-xs font-bold text-neutral-800">Verified Invoice</span>
        </div>
        <PrintInvoiceButton />
      </div>

      {/* Invoice Card */}
      <div className="max-w-3xl mx-auto bg-white border border-black/5 rounded-[2rem] p-8 md:p-12 shadow-md relative overflow-hidden print:border-0 print:shadow-none print:p-0">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-neutral-800 to-neutral-500 print:hidden" />

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-100 pb-8 gap-4">
          <div>
            <h1 className="font-playfair text-3xl font-extrabold text-neutral-900 tracking-tight">
              {tenant.business_name || 'LaunchGrid Store'}
            </h1>
            <p className="text-xs font-semibold text-neutral-500 mt-1">
              {tenant.subdomain}.launchgrid.in
            </p>
            {gstin && (
              <p className="text-xs font-mono font-bold text-neutral-600 mt-0.5">
                GSTIN: {gstin}
              </p>
            )}
          </div>
          <div className="text-left sm:text-right">
            <span className="px-3 py-1 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-full text-[10px] font-black uppercase tracking-widest">
              TAX INVOICE
            </span>
            <div className="text-xs text-neutral-500 font-bold mt-2 font-mono">
              Invoice #{order.id.split('-')[0].toUpperCase()}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 font-medium">
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Addresses & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-neutral-100">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">Billing &amp; Shipping To</h3>
            <div className="space-y-1 text-xs text-neutral-700 font-medium leading-relaxed">
              <p className="font-bold text-neutral-900 text-sm">{order.customer_name}</p>
              <p>{address.street || ''}</p>
              <p>{address.city || ''}{address.state ? `, ${address.state}` : ''} - {address.pincode || ''}</p>
              <p>Phone: {order.customer_phone}</p>
              {order.customer_email && <p>Email: {order.customer_email}</p>}
            </div>
          </div>

          <div className="flex flex-col md:items-end justify-between">
            <div className="space-y-2 text-left md:text-right">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">Payment Status</h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  order.payment_status === 'paid'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {order.payment_status === 'paid' ? 'Paid' : 'Pending / COD'}
                </span>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">Fulfillment</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {order.fulfillment_status === 'shipped' ? 'Shipped' : 'Processing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-8">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-4">Order Summary</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                <th className="pb-3">Item Description</th>
                <th className="pb-3 text-right">Price</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => {
                const title = item.title || item.productName || 'Product Item'
                const price = Number(item.retail_price || item.price || 0)
                const qty = Number(item.quantity || 1)
                const itemTotal = price * qty

                return (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0 text-xs text-neutral-700 font-medium">
                    <td className="py-4.5 pr-4">
                      <div className="font-bold text-neutral-900">{title}</div>
                      {item.sku && <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">SKU: {item.sku}</div>}
                    </td>
                    <td className="py-4.5 text-right font-mono">₹{price}</td>
                    <td className="py-4.5 text-right">{qty}</td>
                    <td className="py-4.5 text-right font-bold text-neutral-900 font-mono">₹{itemTotal}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Tax splits and totals */}
        <div className="border-t border-neutral-200 pt-6 flex flex-col items-end">
          <div className="w-full sm:w-80 space-y-2.5 text-xs text-neutral-500 font-medium">
            <div className="flex justify-between">
              <span>Taxable Value (Subtotal)</span>
              <span className="font-mono">₹{subtotal}</span>
            </div>
            {isInterState ? (
              <div className="flex justify-between">
                <span>IGST ({gstRate}%)</span>
                <span className="font-mono">₹{igst}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>CGST ({halfGst}%)</span>
                  <span className="font-mono">₹{cgst}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({halfGst}%)</span>
                  <span className="font-mono">₹{sgst}</span>
                </div>
              </>
            )}
            {roundingAdjustment !== 0 && (
              <div className="flex justify-between">
                <span>Rounding Adjustment</span>
                <span className="font-mono">₹{roundingAdjustment}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-neutral-900 text-sm font-black uppercase">
              <span>Total Amount (Inc. GST)</span>
              <span className="font-mono text-base">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* Footer legal text */}
        <div className="mt-12 pt-8 border-t border-neutral-100 text-center">
          <p className="text-[10px] text-neutral-400 font-medium leading-relaxed max-w-md mx-auto">
            This is a computer-generated tax invoice. No signature is required. Thank you for supporting local entrepreneurship via LaunchGrid!
          </p>
        </div>

      </div>

      {/* Inline styles for printable optimization */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />
    </div>
  )
}
