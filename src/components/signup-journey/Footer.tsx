'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)] py-20 relative z-10">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-left">
        
        {/* Column 1: Brand Info */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <Link href="/" className="flex items-center gap-2 group mb-4 outline-none">
              <div className="w-8 h-8 rounded bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] flex items-center justify-center font-inter font-bold text-xs shadow-md transition-transform group-hover:scale-105">LG</div>
              <span className="font-playfair font-bold tracking-widest text-xs uppercase text-[var(--color-mark-ink)]">LaunchGrid</span>
            </Link>
            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xs">
              The all-in-one ecommerce engine for India. Launch your store, collect UPI payments, recover abandoned carts, and automate GST invoicing natively.
            </p>
          </div>
          <p className="font-inter text-[10px] text-[var(--color-mark-secondary)] opacity-60 mt-8 md:mt-0">
            © {new Date().getFullYear()} LaunchGrid. All rights reserved.
          </p>
        </div>

        {/* Column 2: Platform Links */}
        <div>
          <h4 className="font-mono text-[10px] font-bold tracking-widest text-[var(--color-mark-muted)] uppercase mb-6">
            Platform
          </h4>
          <ul className="space-y-3.5">
            {[
              { label: 'Discover Featured Stores', href: '/discover' },
              { label: 'Pricing Plan Comparison', href: '/pricing' },
              { label: 'Frequently Asked Questions (FAQ)', href: '/faq' },
              { label: 'Ecommerce Growth Blog', href: '/blog' },
              { label: 'Help Center & Support', href: '/support' },
              { label: 'Platform XML Sitemap', href: '/sitemap.xml' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="font-inter text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Legal & Compliance Links */}
        <div>
          <h4 className="font-mono text-[10px] font-bold tracking-widest text-[var(--color-mark-muted)] uppercase mb-6">
            Compliance & Legal
          </h4>
          <ul className="space-y-3.5">
            {[
              { label: 'Terms & Conditions of Service', href: '/legal/terms' },
              { label: 'Privacy Policy', href: '/legal/privacy' },
              { label: 'Refund & Cancellation Policy', href: '/legal/refund' },
              { label: 'Contact Information', href: '/legal/contact' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="font-inter text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </footer>
  );
}
