import { createServiceClient } from '@/utils/supabase/service'
import { JourneyNav } from '@/components/signup-journey/JourneyNav'
import { Footer } from '@/components/signup-journey/Footer'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { ArrowRight, Sparkles, Store, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 3600 // Refresh discovery feed hourly

// Inline relative time helper
function getRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHrs = Math.floor(diffMs / (3600 * 1000))
  
  if (diffHrs < 1) {
    return 'Just launched'
  }
  if (diffHrs < 24) {
    return `${diffHrs}h ago`
  }
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) {
    return '1 day ago'
  }
  return `${diffDays} days ago`
}

// Check if launched in last 24h
function isNewStore(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return diffMs < 24 * 60 * 60 * 1000
}

export default async function DiscoverPage() {
  const supabase = createServiceClient()
  const nowStr = new Date().toISOString()

  // Fetch featured active stores
  const { data: stores, error } = await supabase
    .from('tenants')
    .select(`
      id,
      business_name,
      subdomain,
      niche,
      created_at,
      featured_until,
      logo_url,
      business_configs(merchant_upi_id, rzp_key_id),
      products(id)
    `)
    .gt('featured_until', nowStr)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching discover stores:', error)
  }

  // Quality Control: Only show stores with products and configured payment methods
  const activeStores = (stores || []).filter((store: any) => {
    const config = store.business_configs?.[0] || {}
    const hasPayment = !!(config.merchant_upi_id || config.rzp_key_id)
    const hasProducts = (store.products?.length ?? 0) > 0
    return hasPayment && hasProducts
  }).slice(0, 24)

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24 px-6 md:px-12 max-w-6xl mx-auto z-10 relative">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[var(--color-mark-amber)]/10 text-amber-700 border border-amber-500/15">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>LaunchGrid Live Showcase</span>
          </div>
          
          <h1 className="font-playfair text-4xl md:text-5xl font-black text-[var(--color-mark-ink)] tracking-tight leading-tight">
            Stores launched on LaunchGrid this week
          </h1>
          
          <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-lg mx-auto leading-relaxed">
            Every store in this showcase was custom-crafted and launched in under 60 seconds by a first-time Indian founder.
          </p>
        </div>

        {/* Showcase Grid */}
        {activeStores.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20">
            {activeStores.map((store) => {
              const isNew = isNewStore(store.created_at)
              const relativeTime = getRelativeTime(store.created_at)
              
              return (
                <a
                  key={store.id}
                  href={`https://${store.subdomain}.launchgrid.in`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-[var(--color-mark-surface)] rounded-3xl border border-[var(--color-mark-default)] p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between min-h-[190px]"
                >
                  <div>
                    {/* Header Row: Niche + New Badge */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700">
                        {store.niche || 'Ecommerce'}
                      </span>
                      {isNew ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] uppercase font-extrabold tracking-widest bg-amber-500 text-zinc-950 border border-amber-400 animate-pulse">
                          New
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[var(--color-mark-secondary)]/60">
                          {relativeTime}
                        </span>
                      )}
                    </div>

                    {/* Logo/Store Icon + Business Name */}
                    <div className="flex items-center gap-3.5 mt-2">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] flex items-center justify-center text-zinc-800 shrink-0 font-playfair font-bold text-lg group-hover:bg-zinc-100 transition-colors">
                        {store.logo_url ? (
                          <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          store.business_name ? store.business_name.charAt(0) : 'S'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] truncate leading-tight">
                          {store.business_name}
                        </h3>
                        <span className="font-inter text-xs text-[var(--color-mark-secondary)] flex items-center gap-1 mt-0.5 truncate">
                          {store.subdomain}.launchgrid.in
                          <ExternalLink className="w-3 h-3 text-[var(--color-mark-secondary)]/50 group-hover:text-[var(--color-mark-ink)] transition-colors shrink-0" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[var(--color-mark-default)] mt-6 pt-4 flex items-center justify-between text-xs text-[var(--color-mark-secondary)] font-bold uppercase tracking-wider group-hover:text-[var(--color-mark-ink)] transition-colors">
                    <span>Explore store</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-[var(--color-mark-surface)] rounded-[2.5rem] border border-[var(--color-mark-default)] mb-20">
            <Store className="w-12 h-12 text-[var(--color-mark-secondary)]/30 mx-auto mb-4" />
            <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-2">No stores featured yet</h3>
            <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-sm mx-auto">
              Be the first to build, launch, and showcase your online brand on our public discover feed.
            </p>
          </div>
        )}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-zinc-900 to-black rounded-[2.5rem] p-8 md:p-12 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 space-y-6 max-w-lg mx-auto">
            <h2 className="font-playfair text-3xl md:text-4xl font-bold tracking-tight">
              Ready to feature your brand here?
            </h2>
            
            <p className="font-inter text-zinc-400 text-sm leading-relaxed">
              Launch your fully-functional store today. Free for 7 days, no credit card required. Import products instantly and start selling.
            </p>
            
            <div className="pt-2">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-white text-black font-inter font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-full hover:bg-zinc-150 transition-colors shadow-lg active:scale-95"
              >
                Start Free Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
