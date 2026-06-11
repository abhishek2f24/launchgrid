import { createClient } from '@/utils/supabase/server'
import { ShoppingBag, ArrowLeft } from 'lucide-react'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

export const dynamicParams = true

export default async function ShopPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, business_name, business_configs(template_style)')
    .eq('subdomain', params.slug)
    .single()

  const { data: products } = await supabase
    .from('products')
    .select('*, global_dropship_catalog(image_urls)')
    .eq('tenant_id', tenant?.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const storeName = tenant?.business_name || 'Our Store'

  if (!products || products.length === 0) {
    return (
      <div className="theme-marketing min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative">
        <GrainOverlay />
        <div className="relative z-10 flex flex-col items-center">
          <ShoppingBag className="w-16 h-16 text-[var(--color-mark-secondary)]/30 mb-6" />
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 tracking-tight">No Products Yet</h1>
          <p className="text-[var(--color-mark-secondary)] font-inter max-w-sm">The catalog is being set up. Check back soon!</p>
          <a href={`/store/${params.slug}`} className="mt-8 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative font-inter">
      <GrainOverlay />
      
      <div className="relative z-10">
        {/* Header / Nav */}
        <header className="border-b border-[var(--color-mark-default)] py-5 px-6 md:px-12 flex items-center justify-between bg-[var(--color-mark-base)]/80 backdrop-blur-md sticky top-0 z-20">
          <a href={`/store/${params.slug}`} className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)] transition-colors" />
            <span className="text-sm font-black tracking-widest uppercase text-[var(--color-mark-ink)]">{storeName}</span>
          </a>
        </header>

        {/* Shop Header */}
        <section className="py-16 md:py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[var(--color-mark-default)] pb-8 mb-12 gap-4">
            <div>
              <p className="text-xs font-black tracking-[0.2em] uppercase text-[var(--color-mark-secondary)] mb-2">Full Catalog</p>
              <h1 className="text-4xl md:text-5xl font-playfair font-bold text-[var(--color-mark-ink)] tracking-tight">All Products</h1>
            </div>
            <span className="text-xs text-[var(--color-mark-secondary)] font-medium bg-[var(--color-mark-default)] px-3 py-1 rounded-full">
              {products.length} items
            </span>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {products.map(product => {
              const image = product.global_dropship_catalog?.image_urls?.[0] || product.image_urls?.[0]
              return (
                <div key={product.id} className="group flex flex-col h-full bg-transparent">
                  <a href={`/store/${params.slug}/product/${product.id}`} className="block mb-4">
                    <div className="aspect-[4/5] bg-[var(--color-mark-muted)] relative border border-[var(--color-mark-default)] overflow-hidden">
                      {image ? (
                        <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[var(--color-mark-muted)]">
                          <ShoppingBag className="w-8 h-8 text-[var(--color-mark-secondary)]/30" />
                        </div>
                      )}
                      
                      {/* Add to Cart Overlay */}
                      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {/* Wrapper to block click from navigating to product page when clicking add to cart */}
                        <div onClick={(e) => e.preventDefault()}>
                          <AddToCartButton productId={product.id} title={product.title} price={product.retail_price || product.price} image={image} variant="minimal" />
                        </div>
                      </div>
                    </div>
                  </a>
                  
                  <div className="flex flex-col flex-1 px-1 gap-1">
                    <h3 className="font-bold text-[var(--color-mark-ink)] text-sm tracking-tight">{product.title}</h3>
                    <div className="mt-auto flex items-center gap-2">
                      <span className="font-inter text-sm text-[var(--color-mark-secondary)]">₹{product.retail_price || product.price}</span>
                      {product.compare_at_price && product.compare_at_price > (product.retail_price || product.price) && (
                        <span className="text-xs text-[var(--color-mark-secondary)]/50 line-through">₹{product.compare_at_price}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
        
        {/* Footer */}
      </div>
    </div>
  )
}
