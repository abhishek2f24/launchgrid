import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { CheckoutForm } from '@/components/store/CheckoutForm'
import { CheckoutSummaryClient } from '@/components/store/CheckoutSummaryClient'
import { ShieldCheck, ArrowLeft, AlertTriangle } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { TrackPageView } from '@/components/store/TrackPageView'

export const dynamicParams = true

const serviceSupabase = createServiceClient()

function CheckoutSummary() {
  return <CheckoutSummaryClient />
}

export default async function CheckoutPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, business_configs(merchant_upi_id, rzp_key_id, cod_enabled)')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) notFound()

  // Fetch subscription plan to check active/trial status (R-02)
  const { data: sub } = await serviceSupabase
    .from('subscriptions')
    .select('status, current_period_end, plan_tier')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const isTrial = sub?.status === 'trialing'
  const isExpired = sub
    ? (isTrial && sub.current_period_end && new Date(sub.current_period_end) < new Date()) ||
      sub.status === 'archived'
    : false

  if (isExpired) {
    return (
      <div className="theme-marketing min-h-screen bg-[#050505] text-[#F8FAFC] font-inter flex flex-col items-center justify-center text-center px-4 relative">
        <GrainOverlay />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-sm">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3 tracking-tight font-playfair">Checkout Temporarily Disabled</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            This store's free trial has expired or checkouts have been disabled by the administrator. If you are the store owner, please upgrade your subscription from your LaunchGrid dashboard to resume checkouts.
          </p>
        </div>
      </div>
    )
  }

  const config = tenant.business_configs?.[0] || {}

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24">
      <TrackPageView storeId={tenant.id} eventType="checkout_start" />
      <GrainOverlay />
      
      <div className="relative z-10">
        <header className="border-b border-[var(--color-mark-default)] py-5 px-6 md:px-12 flex items-center bg-[var(--color-mark-base)]/80 backdrop-blur-md sticky top-0 z-20">
          <a href={`/store/${params.slug}/cart`} className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)] transition-colors" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)]">Back to Cart</span>
          </a>
        </header>

        <div className="container mx-auto px-6 md:px-12 py-12 max-w-6xl">
          <div className="mb-10">
            <h1 className="text-4xl font-playfair font-bold text-[var(--color-mark-ink)] mb-3 tracking-tight">Checkout</h1>
            <div className="flex items-center gap-2 text-xs text-[var(--color-mark-secondary)] font-bold uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              Secure checkout powered by LaunchGrid
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              <CheckoutForm config={{
                tenantId: tenant.id,
                merchantUpiId: config.merchant_upi_id,
                rzpKeyId: config.rzp_key_id,
                codEnabled: config.cod_enabled ?? false,
                storeName: tenant.business_name,
              }} />
            </div>

            {/* Order Summary — client reads from cart */}
            <div className="lg:col-span-2">
              <CheckoutSummary />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
