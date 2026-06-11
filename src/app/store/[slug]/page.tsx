import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { ArrowRight, ShoppingBag, Store, Sparkles, PlusCircle, ChevronRight, Zap } from 'lucide-react'
import { ShareStoreCard } from '@/components/storefront/ShareStoreCard'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { getTemplateConfig } from '@/utils/storefront'
import { Metadata } from 'next'

export const dynamicParams = true;
export const revalidate = false;

const service = createServiceClient()

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const supabase = createServiceClient()
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, business_configs(*)')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) return {}

  const config = tenant.business_configs?.[0] || {}
  const storeName = tenant.business_name || 'Our Store'
  const title = `${storeName} | Online Store`
  const description = config.tagline || 'Shop premium products online.'

  return {
    title,
    description,
    alternates: {
      canonical: `https://${params.slug}.launchgrid.in`,
    },
    openGraph: {
      title,
      description,
      url: `https://${params.slug}.launchgrid.in`,
      siteName: storeName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ─── Owner Action Items (shown to store owner when store is empty) ────────────
function OwnerEmptyState({ storeName, subdomain }: { storeName: string; subdomain: string }) {
  const storeUrl = `https://${subdomain}.launchgrid.in`

  return (
    <div className="theme-marketing min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative">
      <GrainOverlay />
      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-12 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-500/30 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Store Live — No Products Yet
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-[var(--color-mark-ink)] mb-4 leading-tight tracking-tight font-playfair">
            Your store is ready.<br />
            <span className="text-[var(--color-mark-secondary)]">Now, stock it.</span>
          </h1>
          <p className="text-[var(--color-mark-secondary)] text-sm leading-relaxed font-inter">
            You're looking at what your customers see. Add products to make your store come alive.
          </p>
        </div>

        {/* 3 Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-10">
          {/* Card 1 — Import via URL */}
          <a
            href="/dashboard/products?tab=import"
            className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-[var(--color-mark-default)] bg-white shadow-sm hover:shadow-md hover:border-[var(--color-mark-strong)] transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[var(--color-mark-ink)] font-bold text-sm font-inter">Import via URL</h3>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">Fastest</span>
              </div>
              <p className="text-[var(--color-mark-secondary)] text-xs leading-relaxed font-inter">
                Paste any product link from Meesho, Amazon, Ajio, Nykaa, etc. and import it into your store in seconds.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-bold text-purple-600 group-hover:gap-2 transition-all">
              Import Product <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 2 — Add Manually */}
          <a
            href="/dashboard/products"
            className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-[var(--color-mark-default)] bg-white shadow-sm hover:shadow-md hover:border-[var(--color-mark-strong)] transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <PlusCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-[var(--color-mark-ink)] font-bold text-sm mb-1 font-inter">Add Your Own Products</h3>
              <p className="text-[var(--color-mark-secondary)] text-xs leading-relaxed font-inter">
                Have your own inventory? Add products manually with photos, descriptions, and pricing.
              </p>
            </div>
            <div className="mt-auto flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:gap-2 transition-all">
              Add Product <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Card 3 — Share Store */}
          <ShareStoreCard storeUrl={storeUrl} subdomain={subdomain} />
        </div>

        {/* Quick tip */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 max-w-xl w-full">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed font-inter">
            <span className="font-bold">Pro tip:</span> Import 6–8 products from the dropship catalog first, then go to your dashboard and share your store link on Instagram and WhatsApp. Most founders get their first sale within 48 hours.
          </p>
        </div>

        {/* Back to dashboard */}
        <a
          href="/dashboard"
          className="mt-8 text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors font-bold uppercase tracking-wider"
        >
          ← Back to Dashboard
        </a>
      </div>
    </div>
  )
}

// ─── Public Coming Soon (shown to visitors when store is empty) ───────────────
function PublicComingSoon({ storeName }: { storeName: string }) {
  return (
    <div className="theme-marketing min-h-[80vh] flex flex-col items-center justify-center text-center px-4 bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative">
      <GrainOverlay />
      <div className="relative z-10">
        <div className="w-20 h-20 bg-white border border-[var(--color-mark-default)] rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-sm">
          <Store className="w-9 h-9 text-[var(--color-mark-secondary)]" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-mark-ink)] mb-3 tracking-tight font-playfair">Something exciting is coming.</h1>
        <p className="text-[var(--color-mark-secondary)] max-w-sm mx-auto text-sm leading-relaxed mb-8 font-inter">
          <span className="text-[var(--color-mark-ink)] font-bold">{storeName}</span> is stocking up. Check back soon for fresh products.
        </p>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[var(--color-mark-default)] text-xs font-semibold text-[var(--color-mark-secondary)] mx-auto w-fit shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Store is live — products dropping soon
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default async function StoreHomePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient()

  // Get current viewer
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, owner_id, business_configs(*)')
    .eq('subdomain', params.slug)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('*, global_dropship_catalog(image_urls)')
    .eq('tenant_id', tenant?.id)
    .eq('is_active', true)
    .limit(12)

  const config = tenant?.business_configs?.[0] || {}
  const tagline = config.tagline || 'Discover our latest collection of premium products.'
  const heroSubtitle = config.hero_subtitle || 'Shop securely with fast delivery and easy returns.'
  const storeName = tenant?.business_name || 'Our Store'

  // ── Empty store handling ──────────────────
  if (!products || products.length === 0) {
    const isOwner = user && tenant && user.id === tenant.owner_id
    if (isOwner) {
      return <OwnerEmptyState storeName={tenant.business_name} subdomain={params.slug} />
    }
    return <PublicComingSoon storeName={tenant?.business_name || 'This store'} />
  }

  // Fetch subscription plan to gate the powered-by footer (C-06)
  let hidePoweredBy = false
  if (tenant) {
    const { data: sub } = await service
      .from('subscriptions')
      .select('plan_tier')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    const plan = sub?.plan_tier || 'starter'
    hidePoweredBy = plan === 'pro' || plan === 'premium'
  }

  // ── DYNAMIC LAYOUT TEMPLATE SWITCH (H-07 / T-02) ───────────────────────────
  const templateConfig = getTemplateConfig(config.template_style || 'minimal', config.theme_color || 'purple')

  const logoUrl = (tenant as any)?.logo_url || `https://${params.slug}.launchgrid.in/favicon.ico`
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `https://${params.slug}.launchgrid.in/#organization`,
        "name": storeName,
        "url": `https://${params.slug}.launchgrid.in`,
        "logo": logoUrl
      },
      {
        "@type": "WebSite",
        "@id": `https://${params.slug}.launchgrid.in/#website`,
        "url": `https://${params.slug}.launchgrid.in`,
        "name": storeName,
        "description": tagline,
        "publisher": {
          "@id": `https://${params.slug}.launchgrid.in/#organization`
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "LaunchGrid Storefront",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        }
      }
    ]
  }

  return (
    <div 
      className={templateConfig.baseClass} 
      style={templateConfig.accentStyle as React.CSSProperties}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <GrainOverlay />
      
      <div className="relative z-10">
        {/* Nav */}
        <header className={templateConfig.headerClass}>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
            <span className="text-sm font-black tracking-widest uppercase">{storeName}</span>
          </div>
          <a href={`/store/${params.slug}/shop`} className="text-xs font-bold uppercase tracking-widest opacity-80 hover:opacity-100 transition-opacity">
            Shop All →
          </a>
        </header>

        {/* Hero */}
        <section className={templateConfig.heroClass}>
          <p className="text-xs font-black tracking-[0.2em] uppercase opacity-60 mb-6">New Collection</p>
          <h1 className={templateConfig.titleFont}>
            {tagline}
          </h1>
          <p className={templateConfig.subtitleClass}>{heroSubtitle}</p>
          <a href={`/store/${params.slug}/shop`} className={templateConfig.btnClass}>
            Explore Collection <ArrowRight className="w-4 h-4" />
          </a>
        </section>

        {/* Products */}
        <section className="px-6 md:px-12 pb-28 max-w-7xl mx-auto">
          <div className={templateConfig.sectionHeaderClass}>
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Featured Pieces</h2>
            <span className="text-xs opacity-60 font-medium">{products.length} items</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map((product) => {
              const image = product.global_dropship_catalog?.image_urls?.[0] || product.image_urls?.[0]
              const displayPrice = product.retail_price || product.compare_at_price || 0
              return (
                <a key={product.id} href={`/store/${params.slug}/product/${product.id}`} className="group flex flex-col gap-4">
                  <div className={templateConfig.cardClass}>
                    {image ? (
                      <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className={`font-bold text-sm tracking-tight ${templateConfig.inkColor}`}>{product.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`font-inter text-sm font-bold ${templateConfig.inkColor}`}>₹{displayPrice}</span>
                      {product.compare_at_price && Number(product.compare_at_price) > Number(displayPrice) && (
                        <span className="text-xs text-neutral-400 line-through">₹{product.compare_at_price}</span>
                      )}
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className={templateConfig.footerClass}>
          <p className="text-xs font-medium uppercase tracking-widest opacity-60">
            © {new Date().getFullYear()} {storeName}.
            {!hidePoweredBy && (
              <> Powered by{' '}
                <a
                  href="https://launchgrid.in/join"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:opacity-100 transition-opacity"
                >
                  LaunchGrid
                </a>.
              </>
            )}
          </p>
        </footer>
      </div>
    </div>
  )
}
