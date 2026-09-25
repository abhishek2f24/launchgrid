'use client';

import Link from 'next/link';
import { LaunchGridLogo } from '@/components/ui/LaunchGridLogo';

export function Footer() {
  return (
    <footer className="w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)] py-20 relative z-10">
      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 md:gap-8 text-left">
        
        {/* Column 1: Brand Info */}
        <div className="flex flex-col justify-between h-full">
          <div>
            <Link href="/" className="flex items-center group mb-4 outline-none hover:opacity-80 transition-opacity">
              <LaunchGridLogo size={24} variant="light" />
            </Link>
            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xs">
              The all-in-one ecommerce engine for India. Launch your store, collect UPI payments, recover abandoned carts, and automate GST invoicing natively.
            </p>
          </div>
          <p className="font-inter text-xs text-[var(--color-mark-secondary)] opacity-70 mt-8 md:mt-0">
            © {new Date().getFullYear()} LaunchGrid. All rights reserved.
          </p>
        </div>

        {/* Column 2: Platform Links */}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest text-[var(--color-mark-subtle-text)] uppercase mb-6" role="heading" aria-level={3}>
            Platform
          </p>
          <ul className="space-y-3.5">
            {[
              // Apps and Tools first: these are the pages with something to
              // index, and the footer is the only link to them on every page.
              { label: 'Free Business Tools', href: '/tools' },
              { label: 'Android Apps', href: '/apps' },
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

        {/* Seller guides: descriptive anchors to the commercial landing pages.
            The footer is on every marketing page, so this is the strongest
            sitewide internal link those pages get. */}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest text-[var(--color-mark-subtle-text)] uppercase mb-6" role="heading" aria-level={3}>
            Seller Guides
          </p>
          <ul className="space-y-3.5">
            {[
              { label: 'How to sell online in India', href: '/sell-online' },
              { label: 'Sell mobile accessories online', href: '/sell-online/mobile-accessories' },
              { label: 'How to sell sarees online', href: '/sell-online/sarees' },
              { label: 'Sell home decor online', href: '/sell-online/home-decor' },
              { label: 'Profit margin calculator', href: '/tools/profit-margin-calculator' },
              { label: 'Create a GST invoice', href: '/tools/invoice-generator' },
            ].map(l => (
              <li key={l.href}>
                <Link href={l.href} className="font-inter text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Legal & Compliance Links */}
        <div>
          <p className="font-mono text-xs font-bold tracking-widest text-[var(--color-mark-subtle-text)] uppercase mb-6" role="heading" aria-level={3}>
            Compliance & Legal
          </p>
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
