import { createClient } from '@/utils/supabase/server'
import { getActiveTenant } from '@/utils/supabase/queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { saveProductEditAction } from '@/actions/portal'

export default async function EditProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const result = await getActiveTenant()

  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const supabase = await createClient()

  // Fetch product, verifying tenant_id ownership
  const { data: product, error } = await supabase
    .from('products')
    .select('*, global_dropship_catalog(image_urls)')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .single()

  if (error || !product) {
    return notFound()
  }

  const image = product.global_dropship_catalog?.image_urls?.[0] || product.image_urls?.[0]

  return (
    <div className="p-8 max-w-2xl mx-auto font-inter space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="p-2 border border-black/5 bg-white rounded-xl shadow-sm text-[var(--color-mark-secondary)] hover:text-black transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-playfair text-[var(--color-mark-ink)]">Edit Product</h1>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">Modify product information live on your storefront.</p>
        </div>
      </div>

      <form action={async (formData) => {
        'use server';
        await saveProductEditAction(formData);
      }} className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6">
        <input type="hidden" name="productId" value={product.id} />

        <div className="flex items-center gap-4 border-b border-black/5 pb-4">
          <div className="w-14 h-14 bg-black/5 rounded-xl overflow-hidden shrink-0 border border-black/5 flex items-center justify-center">
            {image ? (
              <img src={image} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-5 h-5 text-black/20" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--color-mark-ink)] truncate max-w-md">{product.title}</h3>
            <span className="text-[10px] font-mono text-[var(--color-mark-secondary)] uppercase tracking-wider">
              ID: {product.id.split('-')[0].toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Product Title</label>
            <input
              type="text"
              name="title"
              required
              defaultValue={product.title}
              className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Product Slug</label>
            <input
              type="text"
              name="slug"
              required
              defaultValue={product.slug}
              className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-mono font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
            />
            <p className="text-[10px] text-[var(--color-mark-secondary)]/60 mt-1">URL-friendly identifier. Only lowercase letters, numbers, and dashes.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Retail Price (₹)</label>
              <input
                type="number"
                name="retailPrice"
                required
                defaultValue={Math.round(product.retail_price)}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-[var(--color-mark-secondary)]/40 mt-1">Paid by buyer</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Compare Price (₹)</label>
              <input
                type="number"
                name="compareAtPrice"
                defaultValue={product.compare_at_price ? Math.round(product.compare_at_price) : ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-[var(--color-mark-secondary)]/40 mt-1">Strikethrough / discount</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Cost Price (₹)</label>
              <input
                type="number"
                name="costPrice"
                defaultValue={product.cost_price ? Math.round(product.cost_price) : ''}
                className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
              <p className="text-[10px] text-[var(--color-mark-secondary)]/40 mt-1">Supplier base cost</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Description</label>
            <textarea
              name="description"
              rows={5}
              defaultValue={product.description || ''}
              className="w-full px-4 py-3 bg-black/[0.02] border border-black/10 rounded-xl text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors resize-none leading-relaxed"
              placeholder="Tell your buyers about this product..."
            />
          </div>

          <div className="pt-4 border-t border-black/5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">Search Engine Optimization (SEO)</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Product Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  placeholder="e.g. Buy Leather Wallet Online | Premium Gift Box Included"
                  defaultValue={product.meta_title || ''}
                  className="w-full px-4 py-2.5 bg-black/[0.02] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                />
                <p className="text-[10px] text-[var(--color-mark-secondary)] mt-1 font-medium">Appears in Google Search results. Keep under 60 characters.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest mb-1.5">Product Meta Description</label>
                <textarea
                  name="metaDescription"
                  placeholder="e.g. Purchase our genuine leather wallet at the best price online. Fast shipping across India, Cash on Delivery available."
                  defaultValue={product.meta_description || ''}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/[0.02] border border-black/10 rounded-xl text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors resize-none leading-relaxed"
                />
                <p className="text-[10px] text-[var(--color-mark-secondary)] mt-1 font-medium">Google search description snippet. Keep under 160 characters.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-black/5 flex items-center justify-between gap-4">
          <Link href="/dashboard/products" className="text-sm font-semibold text-[var(--color-mark-secondary)] hover:text-black transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-[var(--color-mark-ink)] text-white text-sm font-bold rounded-xl hover:bg-black/90 shadow-md transition-transform active:scale-95">
            Save Product
          </button>
        </div>
      </form>
    </div>
  )
}
