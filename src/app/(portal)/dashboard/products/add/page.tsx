'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ImagePlus, Tag, FileText, IndianRupee, Layers, CheckCircle2 } from 'lucide-react'

const CATEGORIES = [
  'Electronics', 'Fashion', 'Home & Kitchen', 'Beauty & Personal Care',
  'Sports & Fitness', 'Books & Stationery', 'Toys & Games', 'Food & Grocery', 'Other',
]

export default function AddProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    retail_price: '',
    cost_price: '',
    image_url: '',
    category: '',
  })

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  const margin = form.retail_price && form.cost_price
    ? Math.round(((Number(form.retail_price) - Number(form.cost_price)) / Number(form.retail_price)) * 100)
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/dashboard/products'), 1500)
  }

  if (success) {
    return (
      <div className="p-8 max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-2">Product Added!</h2>
        <p className="text-sm text-[var(--color-mark-secondary)]">Redirecting to your products list…</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto font-inter">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[var(--color-mark-secondary)]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)]">Add Product</h1>
          <p className="text-sm text-[var(--color-mark-secondary)] mt-0.5">Create a product listing for your store</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Product Name */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" /> Product Info
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Premium Wireless Earbuds"
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3 h-3" /> Description
              <span className="normal-case font-semibold text-[var(--color-mark-secondary)]/40">Optional</span>
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe your product — features, material, size, what's included…"
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3 h-3" /> Category
            </label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-all shadow-sm"
            >
              <option value="">Select a category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 flex items-center gap-2">
            <IndianRupee className="w-3.5 h-3.5" /> Pricing
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-mark-secondary)] font-bold text-sm">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.retail_price}
                  onChange={e => set('retail_price', e.target.value)}
                  placeholder="999"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
                />
              </div>
              <p className="text-[10px] text-[var(--color-mark-secondary)]/50 font-medium">Price shown to customers</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider">
                Your Cost (₹)
                <span className="normal-case ml-1 font-semibold text-[var(--color-mark-secondary)]/40">Optional</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-mark-secondary)] font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={form.cost_price}
                  onChange={e => set('cost_price', e.target.value)}
                  placeholder="499"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
                />
              </div>
              <p className="text-[10px] text-[var(--color-mark-secondary)]/50 font-medium">What you pay the supplier</p>
            </div>
          </div>

          {/* Margin preview */}
          {margin !== null && (
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold ${
              margin >= 30
                ? 'bg-green-50 border-green-200 text-green-700'
                : margin >= 15
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span>Your margin</span>
              <span>{margin}% — profit ₹{Number(form.retail_price) - Number(form.cost_price)} per sale</span>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="bg-white border border-black/5 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 flex items-center gap-2">
            <ImagePlus className="w-3.5 h-3.5" /> Product Image
          </h2>

          <div className="flex gap-4 items-start">
            {form.image_url ? (
              <div className="w-20 h-20 rounded-xl border border-black/10 overflow-hidden shrink-0">
                <img
                  src={form.image_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => set('image_url', '')}
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border border-dashed border-black/20 bg-black/[0.02] flex items-center justify-center shrink-0">
                <ImagePlus className="w-6 h-6 text-[var(--color-mark-secondary)]/30" />
              </div>
            )}
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)]/70 uppercase tracking-wider">
                Image URL
                <span className="normal-case ml-1 font-semibold text-[var(--color-mark-secondary)]/40">Optional</span>
              </label>
              <input
                type="url"
                value={form.image_url}
                onChange={e => set('image_url', e.target.value)}
                placeholder="https://example.com/product-image.jpg"
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-all shadow-sm"
              />
              <p className="text-[10px] text-[var(--color-mark-secondary)]/50 font-medium leading-relaxed">
                Paste a direct image URL. You can always update this later.
              </p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-secondary)] hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] py-3.5 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold hover:bg-black/90 shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Adding Product…' : 'Add to My Store'}
          </button>
        </div>

      </form>
    </div>
  )
}
