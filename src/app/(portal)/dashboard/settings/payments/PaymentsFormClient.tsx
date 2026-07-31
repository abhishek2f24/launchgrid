'use client'

import { useState, useRef } from 'react'
import { ShieldCheck, Zap, CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, Truck, QrCode, X } from 'lucide-react'
import { savePaymentConfigAction } from '@/actions/portal'
import { createClient } from '@/utils/supabase/client'

interface Props {
  config: {
    payment_tier: string
    merchant_upi_id: string | null
    merchant_upi_qr_url?: string | null
    rzp_key_id: string | null
    rzp_key_secret: string | null
    cod_enabled?: boolean
  }
  feeOwedThisMonth: number
}

export function PaymentsFormClient({ config, feeOwedThisMonth }: Props) {
  const [activeTier, setActiveTier] = useState(config.payment_tier || 'free_upi')
  const [upiId, setUpiId] = useState(config.merchant_upi_id || '')
  const [upiQrUrl, setUpiQrUrl] = useState(config.merchant_upi_qr_url || '')
  const [qrUploading, setQrUploading] = useState(false)
  const qrFileInputRef = useRef<HTMLInputElement>(null)
  const [rzpKeyId, setRzpKeyId] = useState(config.rzp_key_id || '')
  const [rzpKeySecret, setRzpKeySecret] = useState(config.rzp_key_secret || '')
  const [codEnabled, setCodEnabled] = useState(config.cod_enabled ?? false)
  const [codLoading, setCodLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleQrUpload(file: File | null) {
    if (!file) return
    setQrUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sign in again to upload a QR code')
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
      const { error: uploadError } = await supabase.storage.from('payment-qr-codes').upload(path, file, { upsert: false })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('payment-qr-codes').getPublicUrl(path)
      setUpiQrUrl(data.publicUrl)
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'QR upload failed' })
    } finally {
      setQrUploading(false)
      if (qrFileInputRef.current) qrFileInputRef.current.value = ''
    }
  }

  const handleToggleCod = async () => {
    setCodLoading(true)
    try {
      const formData = new FormData()
      formData.append('codEnabled', String(!codEnabled))
      formData.append('paymentTier', activeTier)
      if (upiId) formData.append('merchantUpiId', upiId)
      if (rzpKeyId) formData.append('rzpKeyId', rzpKeyId)
      const res = await savePaymentConfigAction(formData)
      if (!res.error) setCodEnabled(prev => !prev)
    } catch {}
    setCodLoading(false)
  }

  const handleSave = async (tier: string) => {
    setLoading(true)
    setMessage(null)
    try {
      // Route requires real Razorpay Partner/marketplace approval and a
      // signed webhook secret we don't have — showing a fake success here
      // would tell a merchant they can accept live payments when they
      // can't. Be honest instead of mocking it.
      if (tier === 'route') {
        setMessage({ type: 'error', text: 'LaunchGrid Route needs a Razorpay Partner integration that isn\'t connected yet. Contact support to get on the waitlist — in the meantime, use Merchant UPI or Bring Your Keys.' })
        setLoading(false)
        return
      }

      const formData = new FormData()
      formData.append('paymentTier', tier)

      if (tier === 'free_upi') {
        if (!upiId.trim() && !upiQrUrl.trim()) {
          setMessage({ type: 'error', text: 'Enter a UPI ID or upload a QR code.' })
          setLoading(false)
          return
        }
        formData.append('merchantUpiId', upiId.trim())
        formData.append('merchantUpiQrUrl', upiQrUrl.trim())
      } else if (tier === 'byok') {
        if (!rzpKeyId.trim() || !rzpKeySecret.trim()) {
          setMessage({ type: 'error', text: 'Please enter both Razorpay Key ID and Secret.' })
          setLoading(false)
          return
        }
        formData.append('rzpKeyId', rzpKeyId.trim())
        formData.append('rzpKeySecret', rzpKeySecret.trim())
      }

      const res = await savePaymentConfigAction(formData)
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        // Capability framing: state what the business can now do, not what was configured
        setMessage({ type: 'success', text: tier === 'free_upi' ? 'Customers can now pay you instantly via UPI.' : 'Customers can now pay you with cards, netbanking, wallets and UPI.' })
        setActiveTier(tier)
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {activeTier !== 'route' && (
        <div className="p-5 rounded-2xl border border-black/5 bg-white shadow-sm flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]">Platform fee owed this month</p>
            <p className="text-xs text-[var(--color-mark-secondary)]/70 mt-1 max-w-md">
              Buyers pay you directly — LaunchGrid never holds your money. This is what you owe on your {activeTier === 'byok' ? '5%' : '2%'} plan, invoiced monthly.
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--color-mark-ink)]">₹{feeOwedThisMonth.toLocaleString('en-IN')}</p>
        </div>
      )}

      {message && (
        <div className={`p-4 rounded-xl border flex gap-3 items-start animate-in fade-in duration-300 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 0: UPI */}
        <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between bg-white relative ${
          activeTier === 'free_upi' 
            ? 'border-[var(--color-mark-ink)] shadow-md ring-1 ring-[var(--color-mark-ink)]/10' 
            : 'border-black/5 shadow-sm hover:shadow-md'
        }`}>
          {activeTier === 'free_upi' && (
            <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold uppercase tracking-widest rounded-lg">Active</div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-mark-ink)] text-sm">Merchant UPI</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-secondary)]">Tier 0 (Free)</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-mark-secondary)] mb-6 leading-relaxed">
              Accept direct payments to your UPI ID (GPay, PhonePe, Paytm). 0% transaction fees.
            </p>
            
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">UPI ID</label>
              <input
                type="text"
                placeholder="e.g. storename@okaxis"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-xs font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors"
              />
            </div>

            <div className="space-y-1.5 mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Or upload your UPI QR code</label>
              {upiQrUrl ? (
                <div className="relative w-24 h-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={upiQrUrl} alt="UPI QR code" className="w-full h-full object-contain rounded-xl border border-black/10 bg-white" />
                  <button type="button" onClick={() => setUpiQrUrl('')} aria-label="Remove QR code" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => qrFileInputRef.current?.click()}
                  disabled={qrUploading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-black/20 bg-black/[0.02] text-xs font-bold text-[var(--color-mark-secondary)] hover:border-black/40 transition-colors disabled:opacity-50"
                >
                  {qrUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                  {qrUploading ? 'Uploading…' : 'Upload QR image'}
                </button>
              )}
              <input ref={qrFileInputRef} type="file" accept="image/*" onChange={(e) => handleQrUpload(e.target.files?.[0] ?? null)} className="hidden" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-mark-secondary)]">Platform Fee</span>
              <span className="text-[var(--color-mark-ink)]">2%</span>
            </div>
            <button 
              onClick={() => handleSave('free_upi')}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-black/10 hover:border-black/30 hover:bg-black/[0.02] text-xs font-bold text-[var(--color-mark-ink)] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && activeTier === 'free_upi' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Activate UPI'}
            </button>
          </div>
        </div>

        {/* Tier 1: BYOK */}
        <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between bg-white relative ${
          activeTier === 'byok' 
            ? 'border-[var(--color-mark-ink)] shadow-md ring-1 ring-[var(--color-mark-ink)]/10' 
            : 'border-black/5 shadow-sm hover:shadow-md'
        }`}>
          {activeTier === 'byok' && (
            <div className="absolute top-4 right-4 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold uppercase tracking-widest rounded-lg">Active</div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-mark-ink)] text-sm">Bring Your Keys</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-secondary)]">Tier 1 (BYOK)</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-mark-secondary)] mb-6 leading-relaxed">
              Connect your own Razorpay account. Accept Cards, Wallets, EMI &amp; Netbanking.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Key ID</label>
                <input 
                  type="text" 
                  placeholder="rzp_live_..."
                  value={rzpKeyId}
                  onChange={e => setRzpKeyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-xs font-mono font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Key Secret</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••"
                  value={rzpKeySecret}
                  onChange={e => setRzpKeySecret(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-xs font-mono font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-mark-secondary)]">Platform Fee</span>
              <span className="text-[var(--color-mark-ink)]">5%</span>
            </div>
            <button 
              onClick={() => handleSave('byok')}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-black/10 hover:border-black/30 hover:bg-black/[0.02] text-xs font-bold text-[var(--color-mark-ink)] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && activeTier === 'byok' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Keys'}
            </button>
          </div>
        </div>

        {/* Tier 2: Route */}
        <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between overflow-hidden relative ${
          activeTier === 'route' 
            ? 'border-[var(--color-mark-ink)] shadow-md ring-1 ring-[var(--color-mark-ink)]/10 bg-white' 
            : 'border-black/5 bg-black/[0.01] shadow-sm hover:shadow-md'
        }`}>
          <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-[var(--color-mark-ink)] to-purple-600 text-white text-[8px] font-black tracking-widest uppercase rounded-bl-xl shadow-sm">Recommended</div>
          {activeTier === 'route' && (
            <div className="absolute top-8 right-4 px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-bold uppercase tracking-widest rounded-lg">Active</div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-mark-ink)] text-sm">LaunchGrid Route</h3>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-secondary)]">Tier 2 (Premium)</p>
              </div>
            </div>
            <p className="text-xs text-[var(--color-mark-secondary)] mb-6 leading-relaxed">
              No Razorpay account needed — LaunchGrid handles payments, GST compliance, and disputes for you.
            </p>
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2 mb-6">
              <h5 className="text-[10px] font-bold text-purple-900 uppercase tracking-widest">🌟 Premium Benefits</h5>
              <ul className="space-y-1 text-[11px] text-purple-800/80 font-medium">
                <li>• No Razorpay Account Required</li>
                <li>• Automated Split Payments</li>
                <li>• Unified Payout Dashboard</li>
              </ul>
            </div>
            <p className="text-[10px] text-purple-700/70 font-semibold">Coming soon — requires Razorpay Partner approval, not connected yet.</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--color-mark-secondary)]">Platform Fee</span>
              <span className="text-[var(--color-mark-ink)]">15% → 5%</span>
            </div>
            <button
              onClick={() => handleSave('route')}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--color-mark-ink)] text-white hover:bg-black/90 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading && activeTier === 'route' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Notify me when ready'}
            </button>
          </div>
        </div>
      </div>

      {/* COD Toggle */}
      <div className="p-6 rounded-[2rem] border border-black/5 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--color-mark-ink)] text-sm mb-1">Cash on Delivery (COD)</h3>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-md">
                Allow customers to pay when their order is delivered. COD uses OTP phone verification to reduce fake orders. Recommended for all Indian stores — 60%+ of Indian buyers prefer COD.
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={handleToggleCod}
            disabled={codLoading}
            className={`relative shrink-0 w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
              codEnabled ? 'bg-green-500' : 'bg-black/20'
            }`}
            aria-label={codEnabled ? 'Disable COD' : 'Enable COD'}
          >
            {codLoading ? (
              <Loader2 className="absolute inset-0 m-auto w-4 h-4 text-white animate-spin" />
            ) : (
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                codEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            )}
          </button>
        </div>

        {codEnabled && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 font-medium leading-relaxed">
            ✓ COD is enabled. Customers will receive an OTP to verify their phone number before the order is confirmed.
          </div>
        )}
      </div>
    </div>
  )
}
