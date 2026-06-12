import { Metadata } from 'next'
import { ArrowRight, MapPin, Tag } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { CATEGORY_PAGES, CITY_PAGES } from '@/lib/seo-pages'

export const metadata: Metadata = {
  title: 'Sell Online in India — Create Your Store in 15 Minutes',
  description:
    'Create your online store with UPI, COD, GST invoices and WhatsApp selling built in. Guides for every Indian city and product category — live in 15 minutes.',
  alternates: { canonical: 'https://launchgrid.in/sell-online' },
  openGraph: {
    title: 'Sell Online in India — Create Your Store in 15 Minutes',
    description: 'Your online store with UPI, COD, GST invoices and WhatsApp selling built in.',
    url: 'https://launchgrid.in/sell-online',
    type: 'website',
    images: [{ url: 'https://launchgrid.in/og/sell-online.png', width: 1024, height: 1024 }],
  },
}

export default function SellOnlineHub() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <GrainOverlay />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl pt-16 md:pt-24 space-y-16">

        <div className="space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15]">
            Sell online, wherever you are. Whatever you sell.
          </h1>
          <p className="text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed font-medium">
            LaunchGrid puts Indian businesses online in 15 minutes — UPI and COD checkout, automatic GST
            invoices, and WhatsApp selling tools included. Find the guide for your city or your products below,
            or skip straight to building.
          </p>
          <a href="/onboarding" className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-xl shadow-md active:scale-95">
            Create your free store <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> By city
          </h2>
          <div className="flex flex-wrap gap-2">
            {CITY_PAGES.map(c => (
              <a key={c.slug} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[var(--color-mark-secondary)] hover:text-black hover:border-black/15 transition-colors">
                {c.name}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)] flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" /> By what you sell
          </h2>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_PAGES.map(c => (
              <a key={c.slug} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[var(--color-mark-secondary)] hover:text-black hover:border-black/15 transition-colors">
                {c.name}
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
