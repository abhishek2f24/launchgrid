'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export interface CartItem {
  productId: string
  variantId?: string
  variantTitle?: string
  title: string
  price: number
  image?: string
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  count: number
  total: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children, slug }: { children: ReactNode, slug: string }) {
  const storageKey = `cart_${slug}`
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) setItems(JSON.parse(stored))
    } catch {}
    setMounted(true)
  }, [storageKey])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(storageKey, JSON.stringify(items))
    }
  }, [items, mounted, storageKey])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existing = prev.find(i => 
        i.productId === item.productId && i.variantId === item.variantId
      )
      if (existing) {
        return prev.map(i => 
          i.productId === item.productId && i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => 
      !(i.productId === productId && i.variantId === variantId)
    ))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => 
        !(i.productId === productId && i.variantId === variantId)
      ))
    } else {
      setItems(prev => prev.map(i => 
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity }
          : i
      ))
    }
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, count, total, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
