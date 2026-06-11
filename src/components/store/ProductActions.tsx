'use client'

import { useState } from 'react'
import { ShoppingBag, Check, MessageSquare, AlertCircle, Minus, Plus } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { pixelAddToCart } from '@/lib/pixel'

interface Variant {
  id: string
  product_id: string
  title: string
  sku?: string
  price?: number
  stock: number
}

interface Product {
  id: string
  title: string
  retail_price: number
  compare_at_price?: number
  image_urls?: string[]
  has_variants: boolean
  stock: number
}

interface ProductActionsProps {
  product: Product
  variants: Variant[]
  whatsapp?: string
  storeId?: string
  isExpired?: boolean
}

export function ProductActions({ product, variants, whatsapp, storeId, isExpired = false }: ProductActionsProps) {
  const { addItem } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  // Current active details based on selected variant or base product
  const activePrice = selectedVariant?.price ? Number(selectedVariant.price) : Number(product.retail_price)
  const activeStock = product.has_variants && selectedVariant ? selectedVariant.stock : product.stock
  const isOutOfStock = activeStock <= 0
  const isLowStock = activeStock > 0 && activeStock < 5

  const handleAddToCart = () => {
    if (isOutOfStock || isExpired) return

    const image = product.image_urls?.[0] || ''
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      variantTitle: selectedVariant?.title,
      title: selectedVariant ? `${product.title} - ${selectedVariant.title}` : product.title,
      price: activePrice,
      image,
    })

    // System 4: Track cart_add event
    if (storeId) {
      const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('lg_sid') || '') : ''
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          event_type: 'cart_add',
          product_id: product.id,
          session_id: sessionId,
        }),
        keepalive: true,
      }).catch(() => {})
    }

    // Merchant ad pixels (Meta Pixel / GA4) — no-op if not configured
    pixelAddToCart({ id: product.id, name: product.title, price: activePrice, quantity })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleQtyChange = (val: number) => {
    const newQty = quantity + val
    if (newQty > 0 && newQty <= activeStock) {
      setQuantity(newQty)
    }
  }

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in ${product.title}${
      selectedVariant ? ` (${selectedVariant.title})` : ''
    } priced at ₹${activePrice}. Is it available to order?`
  )

  if (isExpired) {
    return (
      <div className="space-y-6 font-inter">
        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-inter font-bold text-[var(--color-mark-ink)]">
            ₹{activePrice}
          </span>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl flex items-start gap-3 mt-4">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <span>This store is temporarily unavailable. Checkouts and direct orders are inactive.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 font-inter">
      {/* Price section based on selected variant */}
      <div className="flex items-baseline gap-4">
        <span className="text-3xl font-inter font-bold text-[var(--color-mark-ink)]">
          ₹{activePrice}
        </span>
        {product.compare_at_price && product.compare_at_price > activePrice && (
          <span className="text-lg text-[var(--color-mark-secondary)]/60 line-through">
            ₹{product.compare_at_price}
          </span>
        )}
      </div>

      {/* Variants Selector */}
      {product.has_variants && variants.length > 0 && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">
            Select Option
          </label>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariant(v)
                    setQuantity(1)
                  }}
                  className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[var(--color-mark-ink)] text-white border-[var(--color-mark-ink)]'
                      : 'bg-white border-[var(--color-mark-default)] text-[var(--color-mark-ink)] hover:border-[var(--color-mark-strong)]'
                  } ${v.stock <= 0 ? 'opacity-40 line-through' : ''}`}
                >
                  {v.title} {v.stock <= 0 ? '(Sold Out)' : ''}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Stock Urgency Status (🔴 Critical: Urgency Counter) */}
      <div className="space-y-2">
        {isOutOfStock ? (
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-lg w-fit">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Out of Stock
          </div>
        ) : isLowStock ? (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg w-fit animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Only {activeStock} left! Order soon
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-lg w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            In Stock ({activeStock} available)
          </div>
        )}
      </div>

      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">
            Quantity
          </label>
          <div className="flex items-center border border-[var(--color-mark-default)] bg-white w-fit">
            <button
              onClick={() => handleQtyChange(-1)}
              disabled={quantity <= 1}
              className="p-3 text-[var(--color-mark-secondary)] hover:text-black transition-colors disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-bold">{quantity}</span>
            <button
              onClick={() => handleQtyChange(1)}
              disabled={quantity >= activeStock}
              className="p-3 text-[var(--color-mark-secondary)] hover:text-black transition-colors disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 mt-6">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full py-4 bg-[var(--color-mark-ink)] text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors disabled:opacity-50"
        >
          {added ? (
            <><Check className="w-5 h-5" /> Added to Cart</>
          ) : isOutOfStock ? (
            'Sold Out'
          ) : (
            <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
          )}
        </button>

        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${whatsappMessage}`}
            target="_blank"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent border border-[var(--color-mark-default)] text-[var(--color-mark-ink)] hover:bg-[var(--color-mark-default)] text-sm font-bold uppercase tracking-widest transition-all w-full text-center"
          >
            <MessageSquare className="w-4 h-4" /> Order via WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
