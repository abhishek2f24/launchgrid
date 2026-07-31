'use client'

import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'

interface StoreHeaderProps {
  businessName: string
  logoUrl?: string | null
  /** Store subdomain. Nav links are built as /store/{slug}/… so they resolve both on the
   *  path-based route and on the {slug}.launchgrid.in subdomain — bare '/cart' style links
   *  only worked behind the proxy rewrite and 404'd everywhere else. */
  slug: string
}

export function StoreHeader({ businessName, logoUrl, slug }: StoreHeaderProps) {
  const { count } = useCart()
  const initials = businessName.substring(0, 2).toUpperCase()
  const base = `/store/${slug}`

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
          <a href={base} className="font-extrabold text-lg tracking-tight text-white hover:opacity-80 transition-opacity">
            {businessName}
          </a>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
          <a href={base} className="hover:text-white transition-colors">Home</a>
          <a href={`${base}/shop`} className="hover:text-white transition-colors">Products</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href={`${base}/cart`} aria-label="View cart" className="relative p-2.5 hover:bg-white/5 rounded-full transition-colors text-slate-300 hover:text-white">
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
