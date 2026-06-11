'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface StoreHeaderProps {
  businessName: string
  logoUrl?: string | null
}

export function StoreHeader({ businessName, logoUrl }: StoreHeaderProps) {
  const { count } = useCart()
  const initials = businessName.substring(0, 2).toUpperCase()

  return (
    <header className="border-b border-white/10 bg-[#0A0A0C]/80 backdrop-blur-md sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="h-8 w-8 object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-xs shadow-md">
              {initials}
            </div>
          )}
          <a href="/" className="font-extrabold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">
            {businessName}
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
          <a href="/" className="hover:text-white transition-colors">Home</a>
          <a href="/shop" className="hover:text-white transition-colors">Products</a>
          <a href="/about" className="hover:text-white transition-colors">About Us</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="/cart" className="relative p-2.5 hover:bg-white/5 rounded-full transition-colors text-slate-300 hover:text-white">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent-primary)] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </a>
        </div>
      </div>
    </header>
  )
}
