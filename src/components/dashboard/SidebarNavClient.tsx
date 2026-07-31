'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Store, Users, ShoppingBag, Settings, Palette, Puzzle, Ticket, Megaphone, Sparkles, Search, Compass, MoreHorizontal } from 'lucide-react'

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
      <Link href="/dashboard/research" className={linkClass('/dashboard/research')}>
        <Compass className="w-4.5 h-4.5" /> Research
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

/** Sections that have no dedicated slot in the 5-item mobile bar. Without this sheet they
 *  were simply unreachable on a phone — the sidebar that links them is `hidden md:flex`. */
const MOBILE_MORE_LINKS: { href: string; label: string; icon: typeof Users }[] = [
  { href: '/dashboard/customers', label: 'Customers', icon: Users },
  { href: '/dashboard/coupons', label: 'Coupons', icon: Ticket },
  { href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/dashboard/ads', label: 'Ad Generator', icon: Sparkles },
  { href: '/dashboard/seo', label: 'Visibility & SEO', icon: Search },
  { href: '/dashboard/settings/storefront', label: 'Storefront Design', icon: Palette },
  { href: '/dashboard/extension', label: 'Chrome Extension', icon: Puzzle },
]

export function MobileNavClient() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

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
    <>
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
      <Link href="/dashboard/research" className={linkClass('/dashboard/research')}>
        <Compass className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Research</span>
      </Link>
      <Link href="/dashboard/settings" className={linkClass('/dashboard/settings')}>
        <Settings className="w-5 h-5 mb-1" />
        <span className="text-[10px]">Settings</span>
      </Link>
      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
        aria-label="More sections"
        className={`flex flex-col items-center justify-center w-[60px] h-[44px] transition-all duration-200 ${
          moreOpen
            ? 'text-[var(--color-mark-ink)] font-bold'
            : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] font-semibold'
        }`}
      >
        <MoreHorizontal className="w-5 h-5 mb-1" />
        <span className="text-[10px]">More</span>
      </button>
    </nav>

    {moreOpen && (
      <>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 z-40"
        />
        <div className="md:hidden fixed bottom-[68px] left-0 right-0 z-50 bg-white border-t border-black/5 shadow-[0_-10px_40px_rgba(0,0,0,0.12)] rounded-t-2xl p-3">
          <div className="grid grid-cols-2 gap-1">
            {MOBILE_MORE_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                // Close on tap rather than in an effect keyed on pathname — the sheet must
                // never stay open over the page it just navigated to.
                onClick={() => setMoreOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm transition-colors ${
                  isActive(href)
                    ? 'bg-black/5 text-[var(--color-mark-ink)] font-bold'
                    : 'text-[var(--color-mark-secondary)] hover:bg-black/5 font-semibold'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </>
    )}
    </>
  )
}
