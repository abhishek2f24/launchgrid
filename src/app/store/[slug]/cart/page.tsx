'use client'

import { useCart } from '@/contexts/CartContext'
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react'
import { useParams } from 'next/navigation'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart()
  const params = useParams()
  const slug = params?.slug as string

  if (items.length === 0) {
    return (
      <div className="theme-marketing min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative font-inter">
        <GrainOverlay />
        <div className="relative z-10 flex flex-col items-center">
          <ShoppingBag className="w-16 h-16 text-[var(--color-mark-secondary)]/30 mb-6" />
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 tracking-tight">Your cart is empty</h1>
          <p className="text-[var(--color-mark-secondary)] mb-8 max-w-sm">Add some products from the shop to get started.</p>
          <a href={`/store/${slug}/shop`} className="px-8 py-4 bg-[var(--color-mark-ink)] text-white font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors">
            Browse Products
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] relative font-inter pb-24">
      <GrainOverlay />
      
      <div className="relative z-10">
        <header className="border-b border-[var(--color-mark-default)] py-5 px-6 md:px-12 flex items-center bg-[var(--color-mark-base)]/80 backdrop-blur-md sticky top-0 z-20">
          <a href={`/store/${slug}/shop`} className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)] transition-colors" />
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] group-hover:text-[var(--color-mark-ink)]">Continue Shopping</span>
          </a>
        </header>

        <div className="container mx-auto px-6 md:px-12 py-12 max-w-5xl">
          <h1 className="text-4xl font-playfair font-bold text-[var(--color-mark-ink)] mb-8 tracking-tight">Your Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Items */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {items.map(item => {
                const uniqueKey = item.productId + (item.variantId ? `_${item.variantId}` : '')
                return (
                  <div key={uniqueKey} className="flex gap-4 p-4 bg-white border border-[var(--color-mark-default)] shadow-sm">
                    <div className="w-24 h-32 bg-[var(--color-mark-muted)] border border-[var(--color-mark-default)] shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-[var(--color-mark-secondary)]/30" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col min-w-0 py-1">
                      <h3 className="font-bold text-[var(--color-mark-ink)] text-sm mb-1">{item.title}</h3>
                      {item.variantTitle && (
                        <p className="text-xs text-[var(--color-mark-secondary)] mb-2 uppercase tracking-wider font-semibold">
                          Option: {item.variantTitle}
                        </p>
                      )}
                      <p className="text-[var(--color-mark-ink)] font-semibold text-sm">₹{item.price}</p>

                      <div className="flex items-center gap-3 mt-auto">
                        <div className="flex items-center border border-[var(--color-mark-default)]">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-mark-muted)] transition-colors text-[var(--color-mark-ink)]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--color-mark-muted)] transition-colors text-[var(--color-mark-ink)]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between shrink-0 py-1">
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="p-1.5 text-[var(--color-mark-secondary)] hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="text-[var(--color-mark-ink)] font-bold text-base">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="p-8 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] sticky top-28">
                <h2 className="text-sm font-black uppercase tracking-[0.1em] text-[var(--color-mark-ink)] mb-6">Order Summary</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm text-[var(--color-mark-secondary)]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-mark-secondary)]">
                    <span>Shipping</span>
                    <span className="text-green-700 font-semibold uppercase tracking-wider text-xs">Free</span>
                  </div>
                  <div className="h-px bg-[var(--color-mark-default)] my-4" />
                  <div className="flex justify-between font-bold text-[var(--color-mark-ink)] items-end">
                    <span>Total</span>
                    <span className="text-2xl font-playfair tracking-tight">₹{total}</span>
                  </div>
                </div>

                <a
                  href={`/store/${slug}/checkout`}
                  className="w-full flex items-center justify-center py-4 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
                >
                  Proceed to Checkout
                </a>

                <p className="text-[10px] text-[var(--color-mark-secondary)] text-center mt-4 font-semibold uppercase tracking-widest">
                  Secure checkout • 7-day returns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
