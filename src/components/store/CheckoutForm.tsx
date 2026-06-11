'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter, useParams } from 'next/navigation'
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, Zap, Truck } from 'lucide-react'

interface Config {
  tenantId: string
  merchantUpiId?: string | null
  rzpKeyId?: string | null
  codEnabled?: boolean
  storeName: string
}

declare global {
  interface Window {
    Razorpay: any
  }
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]

export function CheckoutForm({ config }: { config: Config }) {
  const { items, total, clearCart } = useCart()
  const router = useRouter()
  const params = useParams()
  const slug = params?.slug as string

  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState('')
  const [error, setError] = useState('')

  // COD + OTP states
  const [selectedMethod, setSelectedMethod] = useState<'online' | 'cod'>('online')
  const [codOtpSent, setCodOtpSent] = useState(false)
  const [codOtp, setCodOtp] = useState('')
  const [codOtpVerified, setCodOtpVerified] = useState(false)
  const [codOtpError, setCodOtpError] = useState('')
  const [codOtpLoading, setCodOtpLoading] = useState(false)

  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null)
  const [couponError, setCouponError] = useState('')

  const finalTotal = appliedCoupon ? Math.max(0, total - appliedCoupon.discountAmount) : total

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: config.tenantId,
          code: couponCode,
          orderAmount: total,
        }),
      })
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({
          code: data.couponCode,
          discountAmount: data.discountAmount,
        })
        setCouponCode('')
      } else {
        setCouponError(data.message || 'Invalid coupon code')
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  // UPI payment and Razorpay polling states
  const [upiState, setUpiState] = useState<{ upiLink: string; orderId: string } | null>(null)
  const [confirmingRazorpay, setConfirmingRazorpay] = useState<{ orderId: string } | null>(null)

  // Poll UPI status (C-04)
  useEffect(() => {
    if (!upiState) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${upiState.orderId}/status`)
        const data = await res.json()
        if (data.payment_status === 'paid') {
          setSuccessOrderId(upiState.orderId)
          clearCart()
          setSuccess(true)
          setUpiState(null)
          clearInterval(interval)
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [upiState, clearCart])

  // Poll Razorpay status (H-03)
  useEffect(() => {
    if (!confirmingRazorpay) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${confirmingRazorpay.orderId}/status`)
        const data = await res.json()
        if (data.payment_status === 'paid') {
          setSuccessOrderId(confirmingRazorpay.orderId)
          clearCart()
          setSuccess(true)
          setConfirmingRazorpay(null)
          clearInterval(interval)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [confirmingRazorpay, clearCart])

  const checkUpiPaymentStatus = async () => {
    if (!upiState) return
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${upiState.orderId}/status`)
      const data = await res.json()
      if (data.payment_status === 'paid') {
        setSuccessOrderId(upiState.orderId)
        clearCart()
        setSuccess(true)
        setUpiState(null)
      } else {
        setError('Payment is still unconfirmed. If you have paid, please wait a moment and try checking again.')
      }
    } catch {
      setError('Could not verify payment status at this moment. Please check again.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && !success && !upiState && !confirmingRazorpay) {
    return (
      <div className="text-center py-16 bg-white border border-[var(--color-mark-default)] p-8">
        <ShoppingBag className="w-12 h-12 text-[var(--color-mark-secondary)]/30 mx-auto mb-4" />
        <p className="text-[var(--color-mark-secondary)]">Your cart is empty. <a href={`/store/${slug}/shop`} className="text-[var(--color-mark-ink)] font-bold uppercase tracking-wider text-xs">Shop now</a></p>
      </div>
    )
  }

  // 1. Confirming Razorpay Webhook Screen
  if (confirmingRazorpay) {
    return (
      <div className="text-center py-16 px-6 bg-white border border-[var(--color-mark-default)] shadow-sm space-y-6">
        <Loader2 className="w-16 h-16 text-[var(--color-mark-ink)] mx-auto animate-spin" />
        <h2 className="text-2xl font-playfair font-bold text-[var(--color-mark-ink)]">Confirming Your Payment...</h2>
        <p className="text-[var(--color-mark-secondary)] max-w-sm mx-auto text-sm leading-relaxed">
          We are verifying payment status with Razorpay webhook. This page will automatically redirect once confirmed.
        </p>
      </div>
    )
  }

  // 2. UPI Deep Link / QR Code Screen (C-04)
  if (upiState) {
    return (
      <div className="text-center py-12 px-6 bg-white border border-[var(--color-mark-default)] shadow-sm space-y-6 font-inter">
        <h2 className="text-2xl font-playfair font-bold text-[var(--color-mark-ink)]">Complete Your UPI Payment</h2>
        <p className="text-sm text-[var(--color-mark-secondary)] max-w-md mx-auto leading-relaxed">
          Please pay <strong>₹{finalTotal}</strong> to complete your order. Scan the QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) or click the link below on mobile.
        </p>
        
        {/* QR Code Container */}
        <div className="w-52 h-52 mx-auto border-2 border-dashed border-[var(--color-mark-default)] p-3 bg-white flex items-center justify-center shadow-inner">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiState.upiLink)}`} 
            alt="Scan to Pay" 
            className="w-full h-full"
          />
        </div>
        
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg max-w-xs mx-auto">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3.5 max-w-xs mx-auto pt-4">
          <a href={upiState.upiLink} className="w-full py-4 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black text-center transition-colors shadow-md">
            Pay via UPI App
          </a>
          <button 
            type="button" 
            onClick={checkUpiPaymentStatus}
            disabled={loading}
            className="w-full py-3.5 border border-[var(--color-mark-default)] text-[var(--color-mark-ink)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-mark-subtle)] transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : 'I have completed payment'}
          </button>
          <button 
            type="button" 
            onClick={() => setUpiState(null)}
            className="text-xs text-[var(--color-mark-secondary)] hover:text-black font-bold uppercase tracking-widest pt-2"
          >
            ← Back to Checkout
          </button>
        </div>
      </div>
    )
  }

  // 3. Success Screen (U-02 copy check)
  if (success) {
    return (
      <div className="text-center py-16 px-6 bg-white border border-[var(--color-mark-default)] shadow-sm space-y-4">
        <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto animate-in zoom-in duration-500" />
        <h2 className="text-2xl font-playfair font-bold text-[var(--color-mark-ink)]">Order Placed!</h2>
        <p className="text-[var(--color-mark-secondary)] max-w-sm mx-auto text-sm leading-relaxed">
          {form.email 
            ? `Thank you for your purchase. We have sent a receipt and invoice details to ${form.email}.`
            : `Thank you for your purchase. Your Order ID is #${successOrderId.split('-')[0].toUpperCase()}. Please keep it for your reference.`
          }
        </p>
        <a href={`/store/${slug}`} className="inline-block mt-4 px-8 py-4 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors">
          Back to Home
        </a>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSendCodOtp = async () => {
    if (!form.phone) { setCodOtpError('Please enter your phone number first.'); return }
    setCodOtpLoading(true)
    setCodOtpError('')
    try {
      const res = await fetch('/api/checkout/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: config.tenantId, phone: form.phone, email: form.email || null }),
      })
      if (res.ok) { setCodOtpSent(true) }
      else { const d = await res.json(); setCodOtpError(d.error || 'Could not send OTP. Try again.') }
    } catch { setCodOtpError('Network error. Please try again.') }
    finally { setCodOtpLoading(false) }
  }

  const handleVerifyCodOtp = async () => {
    if (!codOtp.trim()) { setCodOtpError('Enter the OTP first.'); return }
    setCodOtpLoading(true)
    setCodOtpError('')
    try {
      const res = await fetch('/api/checkout/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: config.tenantId, phone: form.phone, otp: codOtp }),
      })
      const d = await res.json()
      if (d.valid) { setCodOtpVerified(true) }
      else { setCodOtpError(d.error || 'Invalid OTP. Please try again.') }
    } catch { setCodOtpError('Network error. Please try again.') }
    finally { setCodOtpLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      setError('Please fill all required fields.')
      return
    }

    // COD guard: OTP must be verified before placing COD order
    if (selectedMethod === 'cod' && config.codEnabled) {
      if (!codOtpVerified) {
        setError('Please verify your phone number via OTP before placing a COD order.')
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: config.tenantId,
          items,
          total,
          customerDetails: form,
          couponCode: appliedCoupon?.code || null,
          paymentMethod: selectedMethod,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create order')

      // If Razorpay order was created, open Razorpay checkout
      if (data.razorpayOrderId && config.rzpKeyId) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.onload = () => {
          const rzp = new window.Razorpay({
            key: config.rzpKeyId,
            amount: finalTotal * 100,
            currency: 'INR',
            name: config.storeName,
            order_id: data.razorpayOrderId,
            notes: { provisional_order_id: data.orderId },
            prefill: { name: form.name, email: form.email, contact: form.phone },
            theme: { color: '#1A1A18' },
            handler: () => {
              setConfirmingRazorpay({ orderId: data.orderId })
            },
            modal: {
              ondismiss: () => {
                setLoading(false)
              }
            }
          })
          rzp.open()
        }
        document.body.appendChild(script)
        return
      }

      // UPI fallback: return UPI deep link (C-04)
      if (data.upiLink) {
        setUpiState({ upiLink: data.upiLink, orderId: data.orderId })
        setLoading(false)
        return
      }

      // COD / order created, no payment needed now
      setSuccessOrderId(data.orderId)
      clearCart()
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 font-inter bg-white p-6 md:p-10 border border-[var(--color-mark-default)] shadow-sm">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Contact */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-2">Contact</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Full Name *</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Rahul Sharma" required
              className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Phone *</label>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" type="tel" required
              className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Email (optional)</label>
          <input name="email" value={form.email} onChange={handleChange} placeholder="rahul@email.com" type="email"
            className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
        </div>
      </div>

      {/* Shipping (C-05 state selection) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-2">Shipping Address</h3>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Street Address *</label>
          <input name="address" value={form.address} onChange={handleChange} placeholder="123 MG Road, Flat 4B" required
            className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">City *</label>
            <input name="city" value={form.city} onChange={handleChange} placeholder="Bengaluru" required
              className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">State *</label>
            <select name="state" value={form.state} onChange={handleChange} required
              className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors">
              <option value="">Select State</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Pincode *</label>
          <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="560001" maxLength={6} required
            className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors" />
        </div>
      </div>

      {/* Coupon System */}
      <div className="space-y-4 pt-4 border-t border-[var(--color-mark-default)]">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-2">Promo Code</h3>
        {appliedCoupon ? (
          <div className="p-4 bg-green-50 border border-green-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-green-800 uppercase tracking-wider">
                Code Applied: {appliedCoupon.code}
              </p>
              <p className="text-[10px] text-green-600 mt-1 font-medium">
                You saved ₹{appliedCoupon.discountAmount}!
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-widest"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code (e.g. FLAT10)"
              className="flex-1 px-4 py-3 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] rounded-none text-[var(--color-mark-ink)] text-sm focus:outline-none focus:border-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/40 transition-colors uppercase"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-6 py-3 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 transition-colors"
            >
              {couponLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-xs font-medium text-red-600">{couponError}</p>
        )}
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-4 pt-4 border-t border-[var(--color-mark-default)]">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-2">Payment Method</h3>

        <div className="space-y-3">
          {/* Online payment option */}
          {(config.rzpKeyId || config.merchantUpiId) && (
            <button
              type="button"
              onClick={() => setSelectedMethod('online')}
              className={`w-full p-4 border flex gap-3.5 items-start text-left transition-colors ${
                selectedMethod === 'online'
                  ? 'bg-[var(--color-mark-ink)] border-[var(--color-mark-ink)] text-white'
                  : 'bg-[var(--color-mark-base)] border-[var(--color-mark-default)] text-[var(--color-mark-ink)]'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selectedMethod === 'online' ? 'bg-white/20' : 'bg-[var(--color-mark-ink)] text-white'}`}>
                {config.rzpKeyId ? <CreditCard className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="font-bold text-xs">
                  {config.rzpKeyId ? 'Online Payment (Razorpay)' : 'Instant UPI Payment'}
                </h4>
                <p className={`text-[10px] mt-1 font-medium leading-relaxed ${selectedMethod === 'online' ? 'opacity-80' : 'text-[var(--color-mark-secondary)]'}`}>
                  {config.rzpKeyId ? 'Cards, UPI, Netbanking, Wallets — secure checkout.' : 'Direct UPI to merchant. Instant confirmation.'}
                </p>
              </div>
            </button>
          )}

          {/* COD option — only if merchant has enabled it */}
          {config.codEnabled && (
            <div>
              <button
                type="button"
                onClick={() => setSelectedMethod('cod')}
                className={`w-full p-4 border flex gap-3.5 items-start text-left transition-colors ${
                  selectedMethod === 'cod'
                    ? 'bg-[var(--color-mark-ink)] border-[var(--color-mark-ink)] text-white'
                    : 'bg-[var(--color-mark-base)] border-[var(--color-mark-default)] text-[var(--color-mark-ink)]'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${selectedMethod === 'cod' ? 'bg-white/20' : 'bg-[var(--color-mark-ink)] text-white'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">Cash on Delivery (COD)</h4>
                  <p className={`text-[10px] mt-1 font-medium leading-relaxed ${selectedMethod === 'cod' ? 'opacity-80' : 'text-[var(--color-mark-secondary)]'}`}>
                    Pay cash when your order arrives. Phone verification required.
                  </p>
                </div>
              </button>

              {/* COD OTP verification section */}
              {selectedMethod === 'cod' && (
                <div className="mt-3 p-4 bg-orange-50 border border-orange-200 space-y-3">
                  <p className="text-xs font-bold text-orange-900">Phone Verification Required for COD</p>
                  {!codOtpSent ? (
                    <button
                      type="button"
                      onClick={handleSendCodOtp}
                      disabled={codOtpLoading || !form.phone}
                      className="px-4 py-2 bg-orange-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {codOtpLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</> : 'Send OTP to My Phone'}
                    </button>
                  ) : codOtpVerified ? (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-bold">Phone verified ✓</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[11px] text-orange-800 font-medium">
                        OTP sent to {form.email || form.phone}. Enter it below.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={codOtp}
                          onChange={e => setCodOtp(e.target.value)}
                          placeholder="6-digit OTP"
                          className="flex-1 px-3 py-2 border border-orange-300 bg-white text-sm font-bold tracking-widest focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCodOtp}
                          disabled={codOtpLoading}
                          className="px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
                        >
                          {codOtpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                        </button>
                      </div>
                      <button type="button" onClick={handleSendCodOtp} className="text-[11px] text-orange-700 font-semibold underline">
                        Resend OTP
                      </button>
                    </div>
                  )}
                  {codOtpError && <p className="text-xs text-red-600 font-medium">{codOtpError}</p>}
                </div>
              )}
            </div>
          )}

          {/* Fallback: no payment config and no COD */}
          {!config.rzpKeyId && !config.merchantUpiId && !config.codEnabled && (
            <div className="p-4 bg-[var(--color-mark-base)] border border-[var(--color-mark-default)] flex gap-3.5 items-start">
              <div className="w-8 h-8 rounded-xl bg-[var(--color-mark-ink)] text-white flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-[var(--color-mark-ink)]">Manual Order</h4>
                <p className="text-[10px] text-[var(--color-mark-secondary)] mt-1 font-medium leading-relaxed">
                  Place your order and the merchant will contact you to arrange payment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[var(--color-mark-ink)] text-white text-sm font-bold uppercase tracking-widest hover:bg-black disabled:opacity-50 flex items-center justify-center gap-3 transition-colors"
        >
          {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</> : selectedMethod === 'cod' ? `Place COD Order — ₹${finalTotal}` : `Pay ₹${finalTotal}`}
        </button>

        <p className="text-[10px] text-[var(--color-mark-secondary)] text-center font-bold uppercase tracking-widest mt-4">
          256-bit SSL encryption. Your payment is secure.
        </p>
      </div>
    </form>
  )
}
