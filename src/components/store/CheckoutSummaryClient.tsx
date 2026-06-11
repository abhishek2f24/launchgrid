'use client'

import { useCart } from '@/contexts/CartContext'
import { ShoppingBag } from 'lucide-react'

export function CheckoutSummaryClient() {
  const { items, total } = useCart()

  if (items.length === 0) return null

  return (
    <div className="p-8 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] sticky top-28 font-inter">
      <h2 className="text-xs font-black text-[var(--color-mark-ink)] uppercase tracking-[0.2em] mb-6">Order Summary</h2>

      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.productId} className="flex gap-4">
            <div className="w-16 h-20 bg-[var(--color-mark-muted)] border border-[var(--color-mark-default)] shrink-0 overflow-hidden">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-[var(--color-mark-secondary)]/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col py-1">
              <p className="text-[var(--color-mark-ink)] text-sm font-bold truncate mb-1">{item.title}</p>
              <p className="text-[var(--color-mark-secondary)] text-xs font-semibold uppercase tracking-wider">Qty: {item.quantity}</p>
            </div>
            <span className="text-[var(--color-mark-ink)] text-sm font-bold py-1">₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="h-px bg-[var(--color-mark-default)] mb-6" />
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-[var(--color-mark-secondary)]">
          <span>Subtotal</span><span className="font-semibold text-[var(--color-mark-ink)]">₹{total}</span>
        </div>
        <div className="flex justify-between text-sm text-[var(--color-mark-secondary)]">
          <span>Shipping</span><span className="text-green-700 font-bold uppercase tracking-widest text-[10px]">Free</span>
        </div>
        <div className="h-px bg-[var(--color-mark-default)] my-4" />
        <div className="flex justify-between font-bold text-[var(--color-mark-ink)] items-end">
          <span>Total</span>
          <span className="text-2xl font-playfair tracking-tight">₹{total}</span>
        </div>
      </div>
    </div>
  )
}
