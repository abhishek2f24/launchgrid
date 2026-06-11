'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import {
  Plus, MoreHorizontal, ShoppingBag, PlusCircle, ArrowRight,
  Link2, Loader2, CheckCircle2, AlertCircle, ImageOff, Pencil,
  PackagePlus, RotateCcw, ExternalLink, TrendingUp,
  ChevronDown, ChevronUp, Info, Zap, Puzzle
} from 'lucide-react'
import { deleteProductAction, toggleProductStatusAction } from '@/actions/portal'
import { useSearchParams } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Product {
  id: string
  title: string
  slug: string
  retail_price: number
  source: string
  is_active: boolean
  image_urls?: string[]
  global_dropship_catalog?: { image_urls?: string[] } | null
}

interface FetchedProduct {
  title:       string | null
  description: string | null
  price:       number | null
  images:      string[]
  source_url:  string
  source_site: string
  partial:     boolean
}

const EXAMPLE_SITES = ['Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Meesho', 'Ajio', 'Any site']

// ─── My Products tab ──────────────────────────────────────────────────────────
interface MyProductsTabProps {
  products: Product[]
  onDelete: (id: string) => void
  onToggle: (id: string, currentStatus: boolean) => void
}

function MyProductsTab({ products, onDelete, onToggle }: MyProductsTabProps) {
  if (products.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--color-mark-secondary)] font-medium">
          You have no products yet. Choose how to add them:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method A: Chrome Extension (Recommended) */}
          <div className="group flex flex-col justify-between p-7 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[1.5rem] shadow-sm">
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <Puzzle className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-200 text-purple-700 border border-purple-300">
                  Recommended
                </span>
              </div>
              <div>
                <h3 className="font-bold text-purple-950 text-base mb-2">1-Click Chrome Extension</h3>
                <p className="text-xs text-purple-800/80 leading-relaxed font-medium">
                  Import products instantly while browsing Amazon, Meesho, Flipkart, Nykaa, Ajio, or Myntra.
                </p>
              </div>
            </div>
            <Link href="/dashboard/extension"
              className="flex items-center gap-1.5 text-sm font-bold text-purple-700 hover:gap-2.5 transition-all mt-6">
              Install Extension <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Method B: Import from URL */}
          <div className="group flex flex-col justify-between p-7 bg-white border border-black/5 rounded-[1.5rem] shadow-sm">
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-mark-ink)] text-base mb-2">Paste Product Link</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">
                  Paste a product link from Amazon, Meesho, etc. directly here and we will fetch details.
                </p>
              </div>
            </div>
            <button onClick={() => {
              const tabButtons = document.querySelectorAll('button');
              tabButtons.forEach(btn => {
                if (btn.textContent?.includes('Import from URL')) {
                  (btn as HTMLButtonElement).click();
                }
              });
            }}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:gap-2 transition-all text-left mt-6 cursor-pointer">
              Use URL Importer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Method C: Manual add */}
          <Link href="/dashboard/products/add"
            className="group flex flex-col justify-between p-7 bg-white border border-black/5 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-[var(--color-mark-ink)]/20 transition-all">
            <div>
              <div className="flex items-start justify-between mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <PlusCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-mark-ink)] text-base mb-2">Add Your Own Product</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">
                  Fill in product details manually — ideal for custom inventory, handmade goods, or local stock.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 group-hover:gap-2.5 transition-all mt-6">
              Add Manually <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-black/5 bg-black/[0.02]">
            <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Product</th>
            <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Price</th>
            <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Source</th>
            <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Status</th>
            <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => {
            const image = p.global_dropship_catalog?.image_urls?.[0] || p.image_urls?.[0]
            const sourceLabel = p.source === 'manual' ? 'Manual' : p.source === 'url_import' ? 'Imported' : 'Dropship'
            const sourceColor = p.source === 'manual'
              ? 'bg-blue-50 text-blue-700 border-blue-100'
              : p.source === 'url_import'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-purple-50 text-purple-700 border-purple-100'

            return (
              <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black/5 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      {image
                        ? <img src={image} alt={p.title} className="w-full h-full object-cover" />
                        : <ShoppingBag className="w-4 h-4 text-[var(--color-mark-secondary)]/40" />
                      }
                    </div>
                    <div>
                      <div className="font-bold text-[var(--color-mark-ink)] text-sm">{p.title}</div>
                      <div className="text-xs text-[var(--color-mark-secondary)] font-mono">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm font-bold text-[var(--color-mark-ink)]">₹{p.retail_price}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${sourceColor}`}>
                    {sourceLabel}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${
                    p.is_active
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-black/5 text-[var(--color-mark-secondary)] border-black/10'
                  }`}>
                    {p.is_active ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => onToggle(p.id, p.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                        p.is_active 
                          ? 'bg-black/5 text-[var(--color-mark-ink)] hover:bg-black/10 border-transparent' 
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200'
                      }`}
                    >
                      {p.is_active ? 'Draft' : 'Publish'}
                    </button>
                    <Link 
                      href={`/dashboard/products/edit/${p.id}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-[var(--color-mark-secondary)] hover:text-slate-950 transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => onDelete(p.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--color-mark-secondary)] hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="p-4 border-t border-black/5 bg-black/[0.01] flex items-center justify-between">
        <p className="text-xs text-[var(--color-mark-secondary)] font-medium">
          {products.length} product{products.length !== 1 ? 's' : ''} total
        </p>
        <Link href="/dashboard/products/add"
          className="text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Manually
        </Link>
      </div>
    </div>
  )
}

// ─── Import from URL tab ──────────────────────────────────────────────────────
function ImportTab({ onImported }: { onImported: (p: Product) => void }) {
  const [url,       setUrl]       = useState('')
  const [fetched,   setFetched]   = useState<FetchedProduct | null>(null)
  const [fetchErr,  setFetchErr]  = useState('')
  const [isPending, startFetch]   = useTransition()

  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [costPrice,   setCostPrice]   = useState('')
  const [retailPrice, setRetailPrice] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [showDesc,    setShowDesc]    = useState(false)

  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [saveErr, setSaveErr] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)

  const margin = costPrice && retailPrice && Number(retailPrice) > 0
    ? Math.round(((Number(retailPrice) - Number(costPrice)) / Number(retailPrice)) * 100)
    : null

  const handleFetch = () => {
    if (!url.trim()) return
    setFetchErr(''); setFetched(null); setSaved(false); setSaveErr('')
    startFetch(async () => {
      try {
        const res = await fetch('/api/products/fetch-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: url.trim() }),
        })
        const data = await res.json()
        if (!res.ok) { setFetchErr(data.error || 'Failed to fetch'); return }
        setFetched(data)
        setTitle(data.title || '')
        setDescription(data.description || '')
        setRetailPrice(data.price ? String(Math.round(data.price)) : '')
        setCostPrice(data.price ? String(Math.round(data.price)) : '')
        setSelectedImg(0)
      } catch {
        setFetchErr('Something went wrong. Please try again.')
      }
    })
  }

  const handleSave = async () => {
    if (!title || !retailPrice) return
    setSaving(true); setSaveErr('')
    const res = await fetch('/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, description,
        retail_price: Number(retailPrice),
        cost_price:   costPrice ? Number(costPrice) : undefined,
        image_urls:   fetched?.images || [],
        source_url:   fetched?.source_url,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setSaveErr(data.error || 'Save failed'); return }
    setSaved(true)
    onImported(data.product)
  }

  const handleReset = () => {
    setUrl(''); setFetched(null); setFetchErr('')
    setTitle(''); setDescription(''); setCostPrice(''); setRetailPrice('')
    setSaved(false); setSaveErr('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div className="space-y-6">

      {/* URL input card */}
      <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-6">
        <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 mb-3 block">
          Paste any product link
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-mark-secondary)]/40" />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setFetchErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
              placeholder="https://amazon.in/dp/... or any product page"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)]/20 transition-all shadow-sm placeholder:text-[var(--color-mark-secondary)]/30"
              autoFocus
            />
          </div>
          <button onClick={handleFetch} disabled={isPending || !url.trim()}
            className="px-6 py-3 bg-[var(--color-mark-ink)] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shrink-0">
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching…</>
              : <><Zap className="w-4 h-4" /> Fetch</>
            }
          </button>
        </div>

        {/* Site chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {EXAMPLE_SITES.map(s => (
            <span key={s} className="px-3 py-1 rounded-full bg-black/[0.03] border border-black/5 text-xs font-medium text-[var(--color-mark-secondary)]">
              {s}
            </span>
          ))}
        </div>

        {fetchErr && (
          <div className="mt-4 flex items-start gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">{fetchErr}</p>
              <p className="text-xs text-red-500 mt-0.5">
                Some sites block bots. Try a different URL or{' '}
                <Link href="/dashboard/products/add" className="underline font-bold">add it manually</Link>.
              </p>
            </div>
          </div>
        )}

        {fetched?.partial && (
          <div className="mt-4 flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              This site loads content with JavaScript — only partial data was fetched. Fill in the missing fields below before saving.
            </p>
          </div>
        )}
      </div>

      {/* Preview + edit */}
      {fetched && !saved && (
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 bg-black/[0.01]">
            <div className="flex items-center gap-2 text-xs text-[var(--color-mark-secondary)] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Fetched from{' '}
              <a href={fetched.source_url} target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-mark-ink)] font-bold hover:underline inline-flex items-center gap-1">
                {fetched.source_site} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <button onClick={handleReset}
              className="flex items-center gap-1.5 text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors font-medium">
              <RotateCcw className="w-3.5 h-3.5" /> Try another URL
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8">
            {/* Image picker */}
            <div className="flex flex-col gap-3">
              <div className="aspect-square rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center border border-black/5">
                {fetched.images.length > 0
                  ? <img src={fetched.images[selectedImg]} alt="Product" className="w-full h-full object-contain" />
                  : <div className="flex flex-col items-center gap-2 text-[var(--color-mark-secondary)]/30">
                      <ImageOff className="w-10 h-10" />
                      <p className="text-xs">No image found</p>
                    </div>
                }
              </div>
              {fetched.images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {fetched.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImg(i)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImg === i ? 'border-[var(--color-mark-ink)]' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[var(--color-mark-secondary)]/40 text-center font-medium">
                {fetched.images.length} image{fetched.images.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Editable fields */}
            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 mb-1.5">
                  Product Name <Pencil className="w-3 h-3" />
                </label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)]/20 transition-all"
                  placeholder="Product title"
                />
              </div>

              <div>
                <button onClick={() => setShowDesc(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 mb-1.5 hover:text-[var(--color-mark-secondary)] transition-colors">
                  Description <Pencil className="w-3 h-3" />
                  {showDesc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showDesc && (
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-all resize-none"
                    placeholder="Product description (optional)"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 mb-1.5 block">Their Price (₹)</label>
                  <input type="number" value={costPrice} onChange={e => setCostPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] transition-all"
                    placeholder="e.g. 850"
                  />
                  <p className="text-[10px] text-[var(--color-mark-secondary)]/40 mt-1">Source / cost price</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60 mb-1.5 block">
                    Your Price (₹) <span className="text-red-400">*</span>
                  </label>
                  <input type="number" value={retailPrice} onChange={e => setRetailPrice(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)]/20 transition-all"
                    placeholder="e.g. 1100"
                  />
                  <p className="text-[10px] text-[var(--color-mark-secondary)]/40 mt-1">What your customer pays</p>
                </div>
              </div>

              {margin !== null && costPrice && retailPrice && (
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold ${
                  margin >= 30 ? 'bg-green-50 border-green-100 text-green-700'
                  : margin >= 15 ? 'bg-amber-50 border-amber-100 text-amber-700'
                  : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Margin: {margin}%</span>
                  <span>₹{Math.round(Number(retailPrice) - Number(costPrice))} profit / sale</span>
                </div>
              )}

              {saveErr && <p className="text-sm text-red-600 font-medium">{saveErr}</p>}

              <button onClick={handleSave} disabled={saving || !title || !retailPrice}
                className="w-full py-3.5 bg-[var(--color-mark-ink)] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-black/90 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding to store…</>
                  : <><PackagePlus className="w-4 h-4" /> Add to My Store</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {saved && (
        <div className="bg-green-50 border border-green-100 rounded-[1.5rem] p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-green-800 text-lg mb-1">"{title}" added!</h3>
            <p className="text-sm text-green-600">It's now live on your storefront.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleReset}
              className="px-5 py-2.5 bg-[var(--color-mark-ink)] text-white rounded-xl text-sm font-bold hover:bg-black/90 transition-colors shadow-md">
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* Empty tips */}
      {!fetched && !isPending && !fetchErr && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Works on most sites',     desc: 'Amazon, Flipkart, Myntra, Nykaa, Ajio, and most product pages with standard metadata.',  icon: '🌐' },
            { title: 'We extract everything',   desc: 'Product name, images, and price are auto-filled — you just set your margin.',               icon: '⚡' },
            { title: 'You control the price',   desc: "Source price is just reference. You decide what your customers pay on your store.",          icon: '💰' },
          ].map(tip => (
            <div key={tip.title} className="bg-white border border-black/5 rounded-2xl p-5 shadow-sm">
              <div className="text-2xl mb-3">{tip.icon}</div>
              <h3 className="font-bold text-sm text-[var(--color-mark-ink)] mb-1.5">{tip.title}</h3>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type Tab = 'products' | 'import'

export function ProductsPageClient({ initialProducts }: { initialProducts: Product[] }) {
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as Tab
  const [tab,      setTab]      = useState<Tab>(urlTab === 'import' ? 'import' : 'products')
  const [products, setProducts] = useState<Product[]>(initialProducts)

  const handleImported = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev])
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const res = await deleteProductAction(id)
      if (res.success) {
        setProducts(prev => prev.filter(p => p.id !== id))
      } else {
        alert(res.error || 'Failed to delete product')
      }
    }
  }

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleProductStatusAction(id, currentStatus)
    if (res.success) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !p.is_active } : p))
    } else {
      alert(res.error || 'Failed to toggle product status')
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto font-inter space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-1">Products.</h1>
          <p className="text-sm text-[var(--color-mark-secondary)]">
            {products.length > 0
              ? `${products.length} product${products.length !== 1 ? 's' : ''} in your store`
              : 'Add your first product to go live'
            }
          </p>
        </div>
        <Link href="/dashboard/products/add"
          className="px-4 py-2.5 rounded-xl border border-black/10 bg-white text-[var(--color-mark-ink)] text-sm font-bold hover:bg-black/5 shadow-sm transition-colors flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Add Manually
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl w-fit">
        {([
          { id: 'products', label: `My Products${products.length > 0 ? ` (${products.length})` : ''}` },
          { id: 'import',   label: 'Import from URL' },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-white text-[var(--color-mark-ink)] shadow-sm'
                : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'products'
        ? <MyProductsTab products={products} onDelete={handleDelete} onToggle={handleToggle} />
        : <ImportTab onImported={(p) => { handleImported(p); setTab('products') }} />
      }
    </div>
  )
}


