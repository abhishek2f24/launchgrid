import { createServiceClient } from '@/utils/supabase/service'
import { ArrowRight, Store } from 'lucide-react'
import Link from 'next/link'

/**
 * Real social proof: actual live stores built on LaunchGrid, linking out.
 * Replaces fabricated testimonials — "these exist, click them" is the
 * strongest trust signal available. Renders nothing if no stores qualify
 * (an absence is credible; an invention is fatal).
 */
export async function RealStoresGallery() {
  const supabase = createServiceClient()

  const { data: stores } = await supabase
    .from('tenants')
    .select('id, business_name, subdomain, niche, created_at, logo_url, products(id)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)

  // Only show stores with at least one product — must look real when clicked
  const live = (stores || []).filter(s => (s.products?.length ?? 0) > 0).slice(0, 6)

  if (live.length === 0) return null

  return (
    <section className="relative w-full bg-[var(--color-mark-base)] px-6 py-24 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div className="text-left md:text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.15em] font-semibold text-[var(--color-mark-subtle-text)] mb-3">
            Built on LaunchGrid
          </p>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--color-mark-ink)] leading-tight">
            These stores exist. Click them.
          </h2>
          <p className="font-inter text-sm text-[var(--color-mark-secondary)] mt-3 max-w-md md:mx-auto">
            Real businesses, launched by people who were also &ldquo;still thinking about it&rdquo; once.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {live.map(store => (
            <a
              key={store.id}
              href={`https://${store.subdomain}.launchgrid.in?utm_source=launchgrid&utm_medium=homepage_gallery`}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-black/10 rounded-2xl p-6 flex items-center gap-4 hover:shadow-[0_16px_48px_rgba(26,26,24,0.08)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-black/[0.04] border border-black/5 flex items-center justify-center shrink-0 overflow-hidden">
                {store.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={store.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-5 h-5 text-[var(--color-mark-secondary)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-inter font-bold text-sm text-[var(--color-mark-ink)] truncate">{store.business_name}</p>
                <p className="font-inter text-xs font-medium text-[var(--color-mark-secondary)] truncate">
                  {store.niche || 'Online store'} · {store.products?.length ?? 0} products
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)] group-hover:translate-x-0.5 transition-all shrink-0" />
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 font-inter text-sm font-bold text-[var(--color-mark-ink)] hover:gap-3 transition-all"
          >
            Browse all live stores <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
