'use client'

import { useState } from 'react'
import { ShieldCheck, Zap, CreditCard, ArrowRight, Loader2, CheckCircle2, AlertCircle, Truck } from 'lucide-react'
import { savePaymentConfigAction } from '@/actions/portal'

interface Props {
  config: {
    payment_tier: string
    merchant_upi_id: string | null
    rzp_key_id: string | null
    rzp_key_secret: string | null
    cod_enabled?: boolean
  }
}

export function PaymentsFormClient({ config }: Props) {
  const [activeTier, setActiveTier] = useState(config.payment_tier || 'free_upi')
  const [upiId, setUpiId] = useState(config.merchant_upi_id || '')
  const [rzpKeyId, setRzpKeyId] = useState(config.rzp_key_id || '')
  const [rzpKeySecret, setRzpKeySecret] = useState(config.rzp_key_secret || '')
  const [codEnabled, setCodEnabled] = useState(config.cod_enabled ?? false)
  const [codLoading, setCodLoading] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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
      const formData = new FormData()
      formData.append('paymentTier', tier)
      
      if (tier === 'free_upi') {
        if (!upiId.trim()) {
          setMessage({ type: 'error', text: 'Please enter a valid UPI ID.' })
          setLoading(false)
          return
        }
        formData.append('merchantUpiId', upiId.trim())
      } else if (tier === 'byok') {
        if (!rzpKeyId.trim() || !rzpKeySecret.trim()) {
          setMessage({ type: 'error', text: 'Please enter both Razorpay Key ID and Secret.' })
          setLoading(false)
          return
        }
        formData.append('rzpKeyId', rzpKeyId.trim())
        formData.append('rzpKeySecret', rzpKeySecret.trim())
      } else if (tier === 'route') {
        // Mock KYC/Route activation
      }

      const res = await savePaymentConfigAction(formData)
      if (res.error) {
        setMessage({ type: 'error', text: res.error })
      } else {
        setMessage({ type: 'success', text: `Successfully activated ${tier === 'free_upi' ? 'Merchant UPI' : tier === 'byok' ? 'Razorpay BYOK' : 'LaunchGrid Route'}!` })
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
            
            <div className="space-y-1.5 mb-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">UPI ID</label>
              <input 
                type="text" 
                placeholder="e.g. storename@okaxis"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-xs font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors"
              />
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
              1-click instant setup. We process payments, handle GST compliance, and manage disputes.
            </p>
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2 mb-6">
              <h5 className="text-[10px] font-bold text-purple-900 uppercase tracking-widest">🌟 Premium Benefits</h5>
              <ul className="space-y-1 text-[11px] text-purple-800/80 font-medium">
                <li>• No Razorpay Account Required</li>
                <li>• Automated Split Payments</li>
                <li>• Unified Payout Dashboard</li>
              </ul>
            </div>
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
              {loading && activeTier === 'route' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete 1-Click KYC'}
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
