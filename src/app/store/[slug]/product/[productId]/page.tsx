import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, Truck, ShoppingBag } from 'lucide-react'
import { ProductActions } from '@/components/store/ProductActions'
import { TrackPageView } from '@/components/store/TrackPageView'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { Metadata } from 'next'

export const dynamicParams = true

export async function generateMetadata(
  props: { params: Promise<{ slug: string; productId: string }> }
): Promise<Metadata> {
  const params = await props.params
  const supabase = createServiceClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) return {}

  const { data: product } = await supabase
    .from('products')
    .select('*, global_dropship_catalog(image_urls, description)')
    .eq('id', params.productId)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .single()

  if (!product) return {}

  const storeName = tenant.business_name || 'Our Store'
  const title = product.meta_title || `Buy ${product.title} Online | ${storeName}`
  const description = product.meta_description || (product.description || product.global_dropship_catalog?.description || 'Premium quality product, buy online today.').slice(0, 155) + '...'
  const images = product.global_dropship_catalog?.image_urls || product.image_urls || []
  const mainImage = images[0] || ''

  return {
    title,
    description,
    alternates: {
      canonical: `https://${params.slug}.launchgrid.in/product/${params.productId}`,
    },
    openGraph: {
      title,
      description,
      url: `https://${params.slug}.launchgrid.in/product/${params.productId}`,
      siteName: storeName,
      type: 'article',
      images: mainImage ? [{ url: mainImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: mainImage ? [mainImage] : [],
    },
  }
}

export default async function ProductPage(props: {
  params: Promise<{ slug: string; productId: string }>
}) {
  const params = await props.params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_configs(whatsapp_number), business_name')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) notFound()

  // Fetch subscription plan to check active/trial status for gating checkouts/orders
  const serviceSupabase = createServiceClient()

  const { data: sub } = await serviceSupabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const isTrial = sub?.status === 'trialing'
  const isExpired = sub
    ? (isTrial && sub.current_period_end && new Date(sub.current_period_end) < new Date()) ||
      sub.status === 'archived'
    : false

  // Fetch product and its variants
  const [productRes, variantsRes] = await Promise.all([
    supabase
      .from('products')
      .select('*, global_dropship_catalog(image_urls, description)')
      .eq('id', params.productId)
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', params.productId)
      .order('title', { ascending: true })
  ])

  const product = productRes.data
  const variants = variantsRes.data || []

  if (!product) notFound()

  const images: string[] = product.global_dropship_catalog?.image_urls || product.image_urls || []
  const description = product.description
    || product.global_dropship_catalog?.description
    || 'Premium quality product, carefully curated for you.'
  const price = product.retail_price || product.price || 0
  const mainImage = images[0] || ''
  const whatsapp = tenant.business_configs?.[0]?.whatsapp_number
  const storeName = tenant.business_name || 'Our Store'
  
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "name": product.title,
        "image": mainImage ? [mainImage] : [],
        "description": description,
        "offers": {
          "@type": "Offer",
          "url": `https://${params.slug}.launchgrid.in/product/${product.id}`,
          "priceCurrency": "INR",
          "price": price,
          "priceValidUntil": new Date(new Date().getFullYear() + 1, 0, 1).toISOString().split('T')[0],
          "itemCondition": "https://schema.org/NewCondition",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": storeName
          }
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `https://${params.slug}.launchgrid.in`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Shop",
            "item": `https://${params.slug}.launchgrid.in/shop`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": product.title,
            "item": `https://${params.slug}.launchgrid.in/product/${product.id}`
          }
        ]
      }
    ]
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative">
      <TrackPageView storeId={tenant.id} productId={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
      />
      <GrainOverlay />
      
      <div className="relative z-10">
        {/* Header / Nav */}
        <header className="border-b border-[var(--color-mark-default)] py-5 px-6 md:px-12 flex items-center justify-between bg-[var(--color-mark-base)]/80 backdrop-blur-md sticky top-0 z-20">
          <a href={`/store/${params.slug}/shop`} className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)] transition-colors" />
            <span className="text-sm font-black tracking-widest uppercase text-[var(--color-mark-ink)]">{storeName}</span>
          </a>
        </header>

        <main className="container mx-auto px-6 md:px-12 py-16 max-w-6xl">
          <a href={`/store/${params.slug}/shop`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors mb-12">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to shop
          </a>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-[4/5] bg-[var(--color-mark-muted)] border border-[var(--color-mark-default)] rounded-none overflow-hidden relative">
                {images[0] ? (
                  <img src={images[0]} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-16 h-16 text-[var(--color-mark-secondary)]/30" />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {images.slice(1, 5).map((img, i) => (
                    <div key={i} className="aspect-[4/5] bg-[var(--color-mark-muted)] border border-[var(--color-mark-default)] rounded-none overflow-hidden">
                      <img src={img} alt={`View ${i + 2}`} className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity cursor-pointer" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-8 md:pt-8">
              <div>
                <p className="text-xs font-black tracking-[0.2em] uppercase text-[var(--color-mark-secondary)] mb-4">Product Details</p>
                <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] mb-4 leading-tight font-playfair">{product.title}</h1>
              </div>

              <div className="w-full h-px bg-[var(--color-mark-default)]" />

              <p className="text-[var(--color-mark-secondary)] leading-relaxed text-sm font-inter whitespace-pre-wrap">{description}</p>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-mark-ink)]">
                  <Package className="w-4 h-4" /> Secure packaging
                </div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-mark-ink)]">
                  <Truck className="w-4 h-4" /> Fast delivery
                </div>
              </div>

              <ProductActions
                product={{
                  id: product.id,
                  title: product.title,
                  retail_price: product.retail_price || product.price || 0,
                  compare_at_price: product.compare_at_price,
                  image_urls: images,
                  has_variants: product.has_variants || false,
                  stock: product.stock !== undefined ? product.stock : 50
                }}
                variants={variants}
                whatsapp={whatsapp}
                storeId={tenant.id}
                isExpired={isExpired}
              />

              <div className="p-6 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] text-xs text-[var(--color-mark-secondary)] leading-relaxed mt-4">
                <strong className="text-[var(--color-mark-ink)] block mb-1">Our Guarantee</strong>
                Free returns within 7 days. Easy exchanges. Support available 9am–9pm.
              </div>
            </div>
          </div>
        </main>

      </div>
    </div>
  )
}
