'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle, Package, Truck, Printer, Loader2, ExternalLink } from 'lucide-react'

interface OrderActionsClientProps {
  orderId: string
  initialPaymentStatus: string
  initialFulfillmentStatus: string
  subdomain: string
}

export function OrderActionsClient({
  orderId,
  initialPaymentStatus,
  initialFulfillmentStatus,
  subdomain,
}: OrderActionsClientProps) {
  const router = useRouter()
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [fulfillmentStatus, setFulfillmentStatus] = useState(initialFulfillmentStatus)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [loadingFulfill, setLoadingFulfill] = useState(false)
  const [trackingInfo, setTrackingInfo] = useState<{ awb: string; courier: string; url: string } | null>(null)
  const [error, setError] = useState('')

  const handleMarkAsPaid = async () => {
    setError('')
    setLoadingPayment(true)
    try {
      const res = await fetch('/api/orders/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update payment status')
      
      setPaymentStatus('paid')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingPayment(false)
    }
  }

  const handleFulfillOrder = async () => {
    setError('')
    setLoadingFulfill(true)
    try {
      const res = await fetch('/api/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fulfill order')

      setFulfillmentStatus('routed_to_supplier')
      if (data.shipment) {
        setTrackingInfo({
          awb: data.shipment.awb_code,
          courier: data.shipment.courier_name,
          url: data.tracking_url,
        })
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingFulfill(false)
    }
  }

  const handleUpdateFulfillment = async (newStatus: 'shipped' | 'delivered') => {
    setError('')
    setLoadingFulfill(true)
    try {
      const payload: any = {
        orderId,
        fulfillmentStatus: newStatus,
      }
      if (newStatus === 'shipped') {
        payload.trackingInfo = trackingInfo || {
          awb: `AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
          courier: 'Blue Dart Mock',
          url: `https://shiprocket.co/tracking/AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
        }
      }
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Failed to update status to ${newStatus}`)

      setFulfillmentStatus(newStatus)
      if (newStatus === 'shipped' && payload.trackingInfo) {
        setTrackingInfo(payload.trackingInfo)
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoadingFulfill(false)
    }
  }

  const invoiceUrl = `/store/${subdomain}/invoice/${orderId}`

  return (
    <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6 font-inter">
      <div className="flex items-center gap-3 border-b border-black/5 pb-4">
        <Package className="w-5 h-5 text-[var(--color-mark-ink)]" />
        <h2 className="text-base font-bold text-[var(--color-mark-ink)]">Action Console</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
          {error}
        </div>
      )}

      {/* Payment Card */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
          <span>Payment Node</span>
          <span>Status</span>
        </div>
        <div className="p-4 bg-[var(--color-mark-subtle)] border border-black/5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4.5 h-4.5 text-[var(--color-mark-secondary)]" />
            <span className="text-xs font-bold text-[var(--color-mark-ink)] capitalize">
              {paymentStatus}
            </span>
          </div>
          {paymentStatus === 'paid' ? (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-200 rounded">
              Paid
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200 rounded animate-pulse">
              Pending
            </span>
          )}
        </div>
        {paymentStatus !== 'paid' && (
          <button
            onClick={handleMarkAsPaid}
            disabled={loadingPayment}
            className="w-full py-3 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm"
          >
            {loadingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Mark as Paid
          </button>
        )}
      </div>

      {/* Fulfillment Card */}
      <div className="space-y-3 pt-4 border-t border-black/5">
        <div className="flex justify-between items-center text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
          <span>Fulfillment Node</span>
          <span>Status</span>
        </div>
        <div className="p-4 bg-[var(--color-mark-subtle)] border border-black/5 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Truck className="w-4.5 h-4.5 text-[var(--color-mark-secondary)]" />
            <span className="text-xs font-bold text-[var(--color-mark-ink)] capitalize">
              {fulfillmentStatus === 'routed_to_supplier' ? 'routed' : fulfillmentStatus}
            </span>
          </div>
          {fulfillmentStatus === 'delivered' ? (
            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-200 rounded">
              Delivered
            </span>
          ) : fulfillmentStatus === 'shipped' || fulfillmentStatus === 'routed_to_supplier' ? (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-widest border border-blue-200 rounded animate-pulse">
              Shipped
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-black uppercase tracking-widest border border-red-200 rounded">
              Unfulfilled
            </span>
          )}
        </div>

        {fulfillmentStatus === 'unfulfilled' && (
          <button
            onClick={handleFulfillOrder}
            disabled={loadingFulfill}
            className="w-full py-3 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm"
          >
            {loadingFulfill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
            Fulfill Order (Shiprocket)
          </button>
        )}

        {fulfillmentStatus === 'routed_to_supplier' && (
          <div className="space-y-3">
            <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-widest">
                Routed to Shiprocket Courier
              </p>
              {trackingInfo && (
                <div className="text-xs space-y-1 text-slate-600 font-medium">
                  <p>Courier: <strong>{trackingInfo.courier}</strong></p>
                  <p>AWB: <strong className="font-mono">{trackingInfo.awb}</strong></p>
                  <a href={trackingInfo.url} target="_blank" className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline mt-1">
                    Track Shipment <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => handleUpdateFulfillment('shipped')}
              disabled={loadingFulfill}
              className="w-full py-3 bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm"
            >
              {loadingFulfill ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              Mark as Shipped (Send Alert)
            </button>
          </div>
        )}

        {fulfillmentStatus === 'shipped' && (
          <div className="space-y-3">
            <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">
                Shipment Out for Delivery
              </p>
              {trackingInfo && (
                <div className="text-xs space-y-1 text-slate-600 font-medium">
                  <p>Courier: <strong>{trackingInfo.courier}</strong></p>
                  <p>AWB: <strong className="font-mono">{trackingInfo.awb}</strong></p>
                  <a href={trackingInfo.url} target="_blank" className="inline-flex items-center gap-1 text-blue-600 font-bold hover:underline mt-1">
                    Track Shipment <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => handleUpdateFulfillment('delivered')}
              disabled={loadingFulfill}
              className="w-full py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm"
            >
              {loadingFulfill ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Mark as Delivered (Send Alert)
            </button>
          </div>
        )}

        {fulfillmentStatus === 'delivered' && (
          <div className="p-4 border border-green-100 bg-green-50/50 rounded-xl">
            <p className="text-[11px] font-bold text-green-800 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Order Delivered to Customer
            </p>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Customer has been notified via email &amp; WhatsApp.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Link */}
      <div className="pt-4 border-t border-black/5">
        <a
          href={invoiceUrl}
          target="_blank"
          className="w-full py-3 border border-black/10 text-[var(--color-mark-ink)] text-xs font-bold uppercase tracking-widest hover:bg-black/[0.02] flex items-center justify-center gap-2 transition-colors rounded-xl shadow-sm bg-white"
        >
          <Printer className="w-4 h-4" />
          Print / View Invoice
        </a>
      </div>
    </div>
  )
}
