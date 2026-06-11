'use client'

import { useState } from 'react'
import { Check, ShoppingBag } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface Props {
  productId: string
  title: string
  price: number
  image?: string
}

export function AddToCartPrimary({ productId, title, price, image }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addItem({ productId, title, price, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full py-4 bg-[var(--color-mark-ink)] text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
    >
      {added ? (
        <><Check className="w-5 h-5" /> Added to Cart</>
      ) : (
        <><ShoppingBag className="w-5 h-5" /> Add to Cart</>
      )}
    </button>
  )
}
