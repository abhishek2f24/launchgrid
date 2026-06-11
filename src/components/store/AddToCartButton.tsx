'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface Props {
  productId: string
  title: string
  price: number
  image?: string
  variant?: 'minimal' | 'bold'
}

export function AddToCartButton({ productId, title, price, image, variant = 'minimal' }: Props) {
  const { addItem } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigating to product page when clicking this button
    addItem({ productId, title, price, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      className="bg-[var(--color-mark-ink)] text-white font-bold uppercase tracking-widest py-3 px-8 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 text-xs shadow-xl"
    >
      {added ? <span className="flex items-center gap-2"><Check className="w-4 h-4" /> Added</span> : 'Quick Add'}
    </button>
  )
}
