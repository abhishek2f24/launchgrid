'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Mail, Send, CheckCircle2, MessageSquare, Loader2, Sparkles, HelpCircle, ThumbsUp, Camera, AtSign, Image as ImageIcon, Copy, Download } from 'lucide-react'

// The products table stores `title` / `retail_price` — there is no `name` or `selling_price`
// column, so reading those returned undefined and every caption fell back to "Product".
interface Product {
  id: string
  title?: string
  description?: string
  retail_price?: number
  compare_at_price?: number
  image_urls?: string[]
  global_dropship_catalog?: {
    title?: string
    image_urls?: string[]
    base_price?: number
  }
}

function getProductPrice(product: Product): number | undefined {
  return product.retail_price ?? product.global_dropship_catalog?.base_price ?? product.compare_at_price
}

function getProductName(product: Product): string {
  return product.title || product.global_dropship_catalog?.title || 'Product'
}

type SocialPlatform = 'facebook' | 'instagram' | 'x'

const SOCIAL_PLATFORMS: { id: SocialPlatform; label: string; icon: typeof ThumbsUp }[] = [
  { id: 'facebook', label: 'Facebook', icon: ThumbsUp },
  { id: 'instagram', label: 'Instagram', icon: Camera },
  { id: 'x', label: 'X', icon: AtSign },
]

interface SocialPostResult {
  caption: string
  hashtags: string[]
  imageDataUrl: string | null
  imageMessage: string | null
  imagesRemainingToday: number
}

function SocialPostGenerator({ products }: { products: Product[] }) {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [platform, setPlatform] = useState<SocialPlatform>('instagram')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<SocialPostResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null

  async function handleGenerate() {
    if (!selectedProduct) return
    setGenerating(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/marketing/social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            name: getProductName(selectedProduct),
            description: selectedProduct.description,
            price: getProductPrice(selectedProduct),
          },
          platform,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate post')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate post')
    } finally {
      setGenerating(false)
    }
  }

  function handleCopy() {
    if (!result) return
    const text = result.hashtags.length > 0
      ? `${result.caption}\n\n${result.hashtags.map((h) => `#${h}`).join(' ')}`
      : result.caption
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-black/5 pb-3">
        <h2 className="text-sm font-bold text-[var(--color-mark-ink)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Social Media Post Generator
        </h2>
        <span className="text-[10px] font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
          Caption + image, no auto-publishing
        </span>
      </div>

      <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed -mt-3">
        Generates a caption (with hashtags for Instagram/X) and an AI product image you can copy and download, then post yourself.
        We don&apos;t publish directly to Facebook/Instagram/X — that requires each platform&apos;s own developer approval, which isn&apos;t connected yet.
      </p>

      {products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-mark-secondary)]">Add a product first to generate posts for it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              >
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{getProductName(p)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PLATFORMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPlatform(id)}
                    className={`py-3 border rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      platform === id
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white border-black/10 text-[var(--color-mark-ink)] hover:border-black/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[var(--color-mark-secondary)]">
                {platform === 'facebook' ? 'Plain caption, no hashtags.' : 'Includes hashtags.'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedProduct || generating}
              className="w-full px-6 py-3.5 bg-[var(--color-mark-ink)] hover:bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Post</>
              )}
            </button>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{error}</div>
            )}
          </div>

          <div className="space-y-3">
            {result ? (
              <>
                <div className="aspect-square bg-[var(--color-mark-muted)] border border-black/10 rounded-xl overflow-hidden flex items-center justify-center relative">
                  {result.imageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.imageDataUrl} alt="Generated post visual" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-8 h-8 text-[var(--color-mark-secondary)]/40 mx-auto mb-2" />
                      <p className="text-[11px] text-[var(--color-mark-secondary)] font-medium">{result.imageMessage}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                    {result.imagesRemainingToday} of 3 image generations left today
                  </span>
                  {result.imageDataUrl && (
                    <a
                      href={result.imageDataUrl}
                      download={`social-post-${platform}.png`}
                      className="text-xs font-bold text-[var(--color-mark-ink)] flex items-center gap-1 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                </div>
                <div className="p-4 bg-black/[0.02] border border-black/10 rounded-xl space-y-2">
                  <p className="text-sm text-[var(--color-mark-ink)] whitespace-pre-wrap leading-relaxed">{result.caption}</p>
                  {result.hashtags.length > 0 && (
                    <p className="text-xs text-blue-600 font-medium">{result.hashtags.map((h) => `#${h}`).join(' ')}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full px-4 py-2.5 border border-black/10 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:border-black/20 transition-colors"
                >
                  {copied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Caption</>}
                </button>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 border border-dashed border-black/10 rounded-xl">
                <p className="text-xs text-[var(--color-mark-secondary)]">Generated caption and image will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const CAMPAIGN_TEMPLATES = [
  {
    id: 'diwali',
    title: '✨ Diwali Special Festivities Offer',
    channel: 'both',
    subject: '🎉 Diwali Dhamaka: Flat 20% off all premium products!',
    body: 'Greetings from our store! 🪔 As we celebrate the festival of lights, we want to light up your shopping experience with a FLAT 20% discount on everything. Use code DIWALI20 at checkout today!\n\nShop here: {{store_url}}'
  },
  {
    id: 'new_arrivals',
    title: '🚀 New Season Arrival',
    channel: 'both',
    subject: '🔥 Fresh items just dropped at our store!',
    body: 'Hi there! We have just added some amazing new products to our collection that we know you will love. Be the first to grab them before they sell out!\n\nCheck out the new drops here: {{store_url}}'
  },
  {
    id: 'summer_sale',
    title: '☀️ Hot Summer Sale',
    channel: 'email',
    subject: '😎 Chill out with our summer bargains!',
    body: 'The heat is on, and so are our discounts! Shop our summer collection and get free express shipping on all orders above ₹999. Grab yours now!\n\nShop collection: {{store_url}}'
  },
  {
    id: 'restock',
    title: '📦 Back In Stock Alert',
    channel: 'whatsapp',
    subject: 'Items restocked',
    body: 'Good news! Our bestsellers are officially back in stock! We have replenished items in limited numbers, so head over to complete your purchase today.\n\nShop now: {{store_url}}'
  }
]

export function MarketingPageClient({ initialProducts }: { initialProducts: Product[] }) {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [customerCount, setCustomerCount] = useState(0)
  const [success, setSuccess] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    channel: 'email', // 'email' | 'whatsapp'
    campaignName: '',
    subject: '',
    body: '',
  })

  // Fetch unique customer count on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/marketing/stats')
        const data = await res.json()
        if (res.ok) {
          setCustomerCount(data.customerCount || 0)
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const handleApplyTemplate = (tplId: string) => {
    const tpl = CAMPAIGN_TEMPLATES.find(t => t.id === tplId)
    if (!tpl) return
    setForm(prev => ({
      ...prev,
      channel: tpl.channel === 'both' ? prev.channel : tpl.channel,
      subject: tpl.subject,
      body: tpl.body
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/marketing/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send broadcast')
      }

      setSentCount(data.sentCount || 0)
      setSuccess(true)
      // Reset form fields
      setForm(prev => ({ ...prev, campaignName: '', subject: '', body: '' }))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-inter space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 flex items-center gap-2">
          <Megaphone className="w-8 h-8 text-[var(--color-mark-ink)]" /> Marketing &amp; Broadcasts.
        </h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">Create email and WhatsApp broadcast campaigns to engage your buyers and drive sales.</p>
      </div>

      {/* Stats and Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Active Customer List</span>
          {statsLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-mark-secondary)] mt-2" />
          ) : (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[var(--color-mark-ink)]">{customerCount}</span>
              <span className="text-xs text-[var(--color-mark-secondary)] font-medium">buyers on file</span>
            </div>
          )}
        </div>
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Campaign Capacity</span>
          <div className="mt-2 flex items-baseline gap-2">
            {/* Previously hardcoded "Unlimited — with Pro plan", which read as though every
                account (including free) already had unlimited campaigns. */}
            <span className="text-3xl font-bold text-emerald-700">
              {customerCount === 0 ? '—' : customerCount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-[var(--color-mark-secondary)] font-medium">
              {customerCount === 0 ? 'no recipients yet' : 'reachable per broadcast'}
            </span>
          </div>
        </div>
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 flex flex-col justify-between bg-gradient-to-br from-amber-50/50 to-transparent">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Marketing Tips
          </span>
          <p className="text-xs text-amber-900/80 leading-relaxed font-medium mt-2">
            Diwali sales and weekend announcements WhatsApp broadcasts get up to <strong>98% open rates</strong> in India. Add a coupon code to boost conversions!
          </p>
        </div>
      </div>

      {success && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-[1.5rem] flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-sm">Campaign Sent Successfully!</h3>
            <p className="text-xs text-green-700 mt-1">
              Your broadcast has been dispatched to <strong>{sentCount}</strong> active customer recipients. It will be delivered momentarily.
            </p>
            <button
              onClick={() => setSuccess(false)}
              className="text-xs font-bold text-green-800 underline uppercase tracking-widest mt-2 hover:text-green-950 block"
            >
              Create New Campaign
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[1.5rem] text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates Panel */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] px-1">
            Ready-Made Templates
          </h2>
          <div className="space-y-3">
            {CAMPAIGN_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl.id)}
                className="w-full text-left p-4 bg-white border border-black/5 hover:border-black/20 hover:shadow-sm rounded-[1.25rem] transition-all flex flex-col gap-2 group cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-[var(--color-mark-ink)] group-hover:text-black">
                    {tpl.title}
                  </span>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    tpl.channel === 'whatsapp' ? 'bg-green-50 border border-green-200 text-green-700' :
                    tpl.channel === 'email' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                    'bg-slate-50 border border-slate-200 text-slate-700'
                  }`}>
                    {tpl.channel}
                  </span>
                </div>
                <p className="text-[10px] text-[var(--color-mark-secondary)] line-clamp-2 leading-relaxed">
                  {tpl.body.replace('{{store_url}}', 'yourstore.launchgrid.in')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Builder Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold text-[var(--color-mark-ink)] border-b border-black/5 pb-3">
            Broadcast Creator
          </h2>

          <div className="space-y-4">
            {/* Delivery Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                Broadcast Channel
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, channel: 'email' }))}
                  className={`py-3.5 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    form.channel === 'email'
                      ? 'bg-black text-white border-black shadow-sm'
                      : 'bg-white border-black/10 text-[var(--color-mark-ink)] hover:border-black/20'
                  }`}
                >
                  <Mail className="w-4 h-4" /> Email List
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, channel: 'whatsapp' }))}
                  className={`py-3.5 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                    form.channel === 'whatsapp'
                      ? 'bg-green-600 text-white border-green-600 shadow-sm hover:bg-green-700'
                      : 'bg-white border-black/10 text-[var(--color-mark-ink)] hover:border-black/20'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Broadcast
                </button>
              </div>
            </div>

            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                Campaign Name
              </label>
              <input
                type="text"
                required
                value={form.campaignName}
                onChange={e => setForm(f => ({ ...f, campaignName: e.target.value }))}
                placeholder="e.g. Diwali Festivity Promo 2026"
                className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
              />
            </div>

            {/* Subject (Only for Email) */}
            {form.channel === 'email' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="e.g. 🎉 Special Offer: Flat 20% off at our store today!"
                  className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors"
                />
              </div>
            )}

            {/* Campaign Message Body */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
                  Message Content
                </label>
                <span className="text-[10px] text-[var(--color-mark-secondary)]/50 font-semibold">
                  Use <code className="font-mono bg-black/5 px-1 py-0.5">{"{{store_url}}"}</code> to auto-link your store.
                </span>
              </div>
              <textarea
                required
                rows={8}
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                placeholder="Write your email/WhatsApp copy here... Write a short paragraph, outline benefits, and add a link/coupon code."
                className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-black/5 flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || statsLoading || customerCount === 0}
              className="px-6 py-3.5 bg-[var(--color-mark-ink)] hover:bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching Broadcast...</>
              ) : (
                <><Send className="w-4 h-4" /> Send to {customerCount} Customers</>
              )}
            </button>
          </div>
        </form>
      </div>

      <SocialPostGenerator products={initialProducts} />
    </div>
  )
}
