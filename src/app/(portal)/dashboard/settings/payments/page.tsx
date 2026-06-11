import { ShieldCheck, Zap, CreditCard, ArrowRight } from 'lucide-react'
import { getActiveTenant } from '@/utils/supabase/queries'
import { PaymentsFormClient } from './PaymentsFormClient'

export default async function PaymentsSettingsPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No store found.</div>

  const config = result.tenant.business_configs?.[0] || {}

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
      <div>
        <h1 className="text-3xl font-playfair font-bold tracking-tight mb-2 text-[var(--color-mark-ink)]">Payment Configuration</h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">Select how you want to accept payments from your customers.</p>
      </div>

      <PaymentsFormClient config={{
        payment_tier: config.payment_tier,
        merchant_upi_id: config.merchant_upi_id,
        rzp_key_id: config.rzp_key_id,
        rzp_key_secret: config.rzp_key_secret || null,
        cod_enabled: config.cod_enabled ?? false,
      }} />

      <div className="mt-12 p-6 bg-amber-50/50 border border-amber-200 rounded-[1.5rem]">
        <h4 className="font-bold text-sm text-amber-900 mb-2">Compliance Note: GST Requirements</h4>
        <p className="text-xs text-amber-800/80 font-medium leading-relaxed">If you are selling physical goods inter-state (across state borders), GST registration is mandatory from your first rupee. If you sell within your state only, you have up to ₹40 Lakhs exemption. You can start with Merchant UPI today without GST.</p>
        <a href="#" className="inline-flex items-center gap-1 text-xs text-amber-900 font-bold mt-3 hover:underline">Learn more about compliance <ArrowRight className="w-3.5 h-3.5" /></a>
      </div>
    </div>
  )
}
