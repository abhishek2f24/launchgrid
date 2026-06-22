'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Store, Users, ShoppingBag, Settings, Palette, Puzzle, Ticket, Megaphone, Sparkles, Search } from 'lucide-react'

export function SidebarNavClient() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) => {
    const active = isActive(href)
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
      active 
        ? 'bg-black/5 text-[var(--color-mark-ink)] font-bold' 
        : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] hover:bg-black/5 font-semibold'
    }`
  }

  return (
    <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
      <div className="text-xs font-bold text-[var(--color-mark-secondary)]/60 uppercase tracking-widest mb-4 px-2">Store Management</div>
      <Link href="/dashboard" className={linkClass('/dashboard')}>
        <LayoutDashboard className="w-4.5 h-4.5" /> Dashboard
      </Link>
      <Link href="/dashboard/products" className={linkClass('/dashboard/products')}>
        <ShoppingBag className="w-4.5 h-4.5" /> Products
      </Link>
      <Link href="/dashboard/orders" className={linkClass('/dashboard/orders')}>
        <Store className="w-4.5 h-4.5" /> Orders
      </Link>
      <Link href="/dashboard/customers" className={linkClass('/dashboard/customers')}>
        <Users className="w-4.5 h-4.5" /> Customers
      </Link>
      <Link href="/dashboard/coupons" className={linkClass('/dashboard/coupons')}>
        <Ticket className="w-4.5 h-4.5" /> Coupons
      </Link>
      <Link href="/dashboard/marketing" className={linkClass('/dashboard/marketing')}>
        <Megaphone className="w-4.5 h-4.5" /> Marketing
      </Link>
      <Link href="/dashboard/ads" className={linkClass('/dashboard/ads')}>
        <Sparkles className="w-4.5 h-4.5" /> Ad Generator
      </Link>
      <Link href="/dashboard/seo" className={linkClass('/dashboard/seo')}>
        <Search className="w-4.5 h-4.5" /> Visibility &amp; SEO
      </Link>
      
      <div className="mt-8 mb-4 px-2 text-xs font-bold text-[var(--color-mark-secondary)]/60 uppercase tracking-widest">Configuration</div>
      <Link href="/dashboard/extension" className={linkClass('/dashboard/extension')}>
        <Puzzle className="w-4.5 h-4.5" /> Chrome Extension
      </Link>
      <Link href="/dashboard/settings/storefront" className={linkClass('/dashboard/settings/storefront')}>
        <Palette className="w-4.5 h-4.5" /> Storefront Design
      </Link>
      <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')}>
        <Settings className="w-4.5 h-4.5" /> Settings
      </Link>
    </div>
  )
}

export function MobileNavClient() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const linkClass = (href: string) => {
    const active = isActive(href)
    return `flex flex-col items-center justify-center w-[60px] h-[44px] transition-all duration-200 ${
      active 
        ? 'text-[var(--color-mark-ink)] font-bold' 
        : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] font-semibold'
    }`
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white/90 border-t border-black/5 flex items-center justify-around z-50 pb-safe backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
      <Link href="/dashboard" className={linkClass('/dashboard')}>
        <LayoutDashboard className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Home</span>
      </Link>
      <Link href="/dashboard/products" className={linkClass('/dashboard/products')}>
        <ShoppingBag className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Products</span>
      </Link>
      <Link href="/dashboard/orders" className={linkClass('/dashboard/orders')}>
        <Store className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Orders</span>
      </Link>
      <Link href="/dashboard/seo" className={linkClass('/dashboard/seo')}>
        <Search className="w-5 h-5 mb-1" />
        <span className="text-[10px]">SEO</span>
      </Link>
      <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')}>
        <Settings className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Settings</span>
      </Link>
    </nav>
  )
}
