'use client'

import { useState, useCallback } from 'react'
import {
  Sparkles,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Megaphone,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdFormat = 'meta_feed' | 'meta_story' | 'whatsapp_status' | 'google_display'

interface Product {
  id: string
  name: string
  description?: string
  selling_price?: number
  price?: number
  images?: string[]
  global_dropship_catalog?: {
    title?: string
    image_urls?: string[]
    base_price?: number
  }
}

interface AdVariant {
  headline: string
  body: string
  cta: string
}

interface Props {
  initialProducts: Product[]
}

// ---------------------------------------------------------------------------
// Format config
// ---------------------------------------------------------------------------

const AD_FORMATS: { id: AdFormat; label: string; description: string; badge: string }[] = [
  {
    id: 'meta_feed',
    label: 'Meta Feed Ad',
    description: 'Square image + text, shown in Facebook & Instagram feeds',
    badge: '1:1',
  },
  {
    id: 'meta_story',
    label: 'Meta Story / Reel',
    description: 'Vertical full-screen, 9:16 format for Stories & Reels',
    badge: '9:16',
  },
  {
    id: 'whatsapp_status',
    label: 'WhatsApp Status',
    description: 'Casual, emoji-friendly copy that sounds like a friend',
    badge: 'WA',
  },
  {
    id: 'google_display',
    label: 'Google Display Ad',
    description: 'Clean and direct copy for Google Display Network',
    badge: 'GDN',
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProductImageUrl(product: Product): string | null {
  if (product.images && product.images.length > 0) return product.images[0]
  if (product.global_dropship_catalog?.image_urls?.length) {
    return product.global_dropship_catalog.image_urls[0]
  }
  return null
}

function getProductPrice(product: Product): number | undefined {
  return product.selling_price ?? product.price ?? product.global_dropship_catalog?.base_price
}

function getProductName(product: Product): string {
  return product.name || product.global_dropship_catalog?.title || 'Product'
}

// ---------------------------------------------------------------------------
// Variant Card
// ---------------------------------------------------------------------------

function VariantCard({ variant, index }: { variant: AdVariant; index: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    const text = `${variant.headline}\n\n${variant.body}\n\n${variant.cta}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [variant])

  const badgeColors = [
    'bg-violet-100 text-violet-700',
    'bg-sky-100 text-sky-700',
    'bg-amber-100 text-amber-700',
  ]

  return (
    <div className="bg-white border border-black/5 rounded-[1.5rem] p-6 shadow-sm flex flex-col gap-4">
      {/* Badge + Actions */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${badgeColors[index] ?? badgeColors[0]}`}>
          V{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-1.5 rounded-lg hover:bg-black/5"
          >
            {copied ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Copied!</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy</>
            )}
          </button>
          <a
            href="https://business.facebook.com/adsmanager/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export to Meta</span>
          </a>
        </div>
      </div>

      {/* Headline */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-1">Headline</p>
        <p className="text-xl font-playfair font-bold text-[var(--color-mark-ink)] leading-snug">
          {variant.headline}
        </p>
      </div>

      {/* Body */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-1">Body Copy</p>
        <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed">
          {variant.body}
        </p>
      </div>

      {/* CTA Preview */}
      <div className="mt-auto">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">CTA Preview</p>
        <span className="inline-block px-5 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-lg">
          {variant.cta}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export function AdsPageClient({ initialProducts }: Props) {
  const products = initialProducts

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null)
  const [targetAge, setTargetAge] = useState('')
  const [targetCities, setTargetCities] = useState('')

  const [generating, setGenerating] = useState(false)
  const [variants, setVariants] = useState<AdVariant[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canGenerate = selectedProduct !== null && selectedFormat !== null && !generating

  const handleGenerate = async () => {
    if (!selectedProduct || !selectedFormat) return
    setGenerating(true)
    setError(null)
    setVariants(null)

    try {
      const price = getProductPrice(selectedProduct)
      const res = await fetch('/api/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: {
            name: getProductName(selectedProduct),
            description: selectedProduct.description,
            price,
            image_url: getProductImageUrl(selectedProduct),
          },
          format: selectedFormat,
          targetAge: targetAge.trim() || undefined,
          targetCities: targetCities.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate ads')
      }

      setVariants(data.variants)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-inter space-y-10">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-[var(--color-mark-ink)]" /> Ad Generator.
        </h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">
          Create scroll-stopping ads for Meta, WhatsApp &amp; Google in seconds.
        </p>
      </div>

      {/* Step 1 — Select Product */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--color-mark-ink)] text-white text-[9px] font-black flex items-center justify-center shrink-0">1</span>
          Select a Product
        </h2>

        {products.length === 0 ? (
          <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm text-center">
            <Megaphone className="w-10 h-10 text-[var(--color-mark-secondary)]/30 mx-auto mb-3" />
            <h3 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-1">No products yet</h3>
            <p className="text-sm text-[var(--color-mark-secondary)] mb-4 max-w-xs mx-auto">
              Add at least one product to start creating ads for it.
            </p>
            <Link
              href="/dashboard/products"
              className="inline-block px-5 py-2.5 rounded-xl bg-[var(--color-mark-ink)] text-white text-xs font-bold hover:bg-black/90 transition-all"
            >
              Go to Products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => {
              const imageUrl = getProductImageUrl(product)
              const price = getProductPrice(product)
              const name = getProductName(product)
              const isSelected = selectedProduct?.id === product.id

              return (
                <button
                  key={product.id}
                  onClick={() => setSelectedProduct(isSelected ? null : product)}
                  className={`text-left rounded-[1.5rem] border-2 transition-all overflow-hidden flex flex-col ${
                    isSelected
                      ? 'border-[var(--color-mark-ink)] shadow-md'
                      : 'border-black/5 hover:border-black/20 bg-white'
                  }`}
                >
                  {/* Product Image */}
                  <div className="relative w-full aspect-square bg-black/[0.02]">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-[var(--color-mark-secondary)]/20" />
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-white drop-shadow fill-[var(--color-mark-ink)]" />
                      </div>
                    )}
                  </div>
                  {/* Product Info */}
                  <div className={`p-3 flex-1 ${isSelected ? 'bg-[var(--color-mark-ink)]' : 'bg-white'}`}>
                    <p className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-white' : 'text-[var(--color-mark-ink)]'}`}>
                      {name}
                    </p>
                    {price !== undefined && (
                      <p className={`text-[10px] font-semibold mt-1 ${isSelected ? 'text-white/70' : 'text-[var(--color-mark-secondary)]'}`}>
                        ₹{price}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Step 2 — Select Ad Format */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--color-mark-ink)] text-white text-[9px] font-black flex items-center justify-center shrink-0">2</span>
          Select Ad Format
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AD_FORMATS.map((fmt) => {
            const isSelected = selectedFormat === fmt.id
            return (
              <button
                key={fmt.id}
                onClick={() => setSelectedFormat(isSelected ? null : fmt.id)}
                className={`text-left p-5 rounded-[1.5rem] border-2 transition-all flex flex-col gap-2 ${
                  isSelected
                    ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-ink)] shadow-md'
                    : 'border-black/5 bg-white hover:border-black/20 hover:shadow-sm'
                }`}
              >
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md w-fit ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-black/5 text-[var(--color-mark-secondary)]'
                }`}>
                  {fmt.badge}
                </span>
                <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-[var(--color-mark-ink)]'}`}>
                  {fmt.label}
                </p>
                <p className={`text-[10px] leading-relaxed ${isSelected ? 'text-white/70' : 'text-[var(--color-mark-secondary)]'}`}>
                  {fmt.description}
                </p>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-white/80 mt-1 self-end" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* Step 3 — Targeting (optional) */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[var(--color-mark-ink)] text-white text-[9px] font-black flex items-center justify-center shrink-0">3</span>
          Targeting
          <span className="text-[9px] font-semibold normal-case tracking-normal text-[var(--color-mark-secondary)]/50 ml-1">(optional)</span>
        </h2>
        <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
              Age Range
            </label>
            <input
              type="text"
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              placeholder="25-34"
              className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm font-medium text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors placeholder:text-[var(--color-mark-secondary)]/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">
              Target Cities
            </label>
            <input
              type="text"
              value={targetCities}
              onChange={(e) => setTargetCities(e.target.value)}
              placeholder="Mumbai, Delhi, Bengaluru"
              className="w-full px-4 py-3 bg-black/[0.01] border border-black/10 rounded-xl text-sm font-medium text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:bg-white transition-colors placeholder:text-[var(--color-mark-secondary)]/40"
            />
          </div>
        </div>
      </section>

      {/* Generate Button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="px-10 py-4 bg-[var(--color-mark-ink)] hover:bg-black text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed min-w-[260px]"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating your ads...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate 3 Ad Variants
            </>
          )}
        </button>
        {(!selectedProduct || !selectedFormat) && (
          <p className="text-[10px] text-[var(--color-mark-secondary)]/60 font-medium">
            {!selectedProduct && !selectedFormat
              ? 'Select a product and ad format to continue'
              : !selectedProduct
              ? 'Now select a product'
              : 'Now select an ad format'}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-[1.5rem] text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Output — 3 Variant Cards */}
      {variants && variants.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Your Ad Variants
            </h2>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <Sparkles className="w-3 h-3" /> Regenerate
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {variants.map((variant, i) => (
              <VariantCard key={i} variant={variant} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
