import { Metadata } from 'next'
import { ArrowRight, MapPin, Tag, BookOpen } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { ALL_SEO_PAGES, CATEGORY_PAGES, CITY_PAGES } from '@/lib/seo-pages'
import { SELL_GUIDES } from '@/lib/sell-online-guides'

const TITLE = 'How to Sell Online in India: Step-by-Step Guides by Product & City'
const DESCRIPTION =
  'How to start selling online in India: pick products, work out margins after shipping and COD returns, handle GST, and take UPI and COD orders from your own store. Guides for sarees, mobile accessories, home decor and more.'

const GUIDES = ALL_SEO_PAGES.filter(p => p.slug in SELL_GUIDES).map(p => ({ page: p, guide: SELL_GUIDES[p.slug] }))

const STEPS = [
  { title: 'Choose a focused product range', body: 'Buyers search for specific things, like "Banarasi silk saree" or "iPhone 15 case", not "online shop". A narrow range is easier to stock, photograph and rank.' },
  { title: 'Price for the real cost of an order', body: 'Add shipping, packaging, the payment gateway fee and a buffer for COD returns to your product cost, then set a price that leaves a healthy net margin.' },
  { title: 'Set up a store with UPI and COD', body: 'Indian buyers expect UPI for speed and Cash on Delivery for trust on a first order. A one-page checkout with both converts far better than taking orders in DMs.' },
  { title: 'Sort out GST and invoices', body: 'Below the threshold you can often start without a GSTIN when selling within your state. Selling to other states generally needs registration, with IGST on the invoice.' },
  { title: 'Share where your buyers already are', body: 'Put your store link on WhatsApp status, broadcast lists, Instagram bio and every paper bill. Existing customers are the fastest first orders.' },
]

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://launchgrid.in/sell-online' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://launchgrid.in/sell-online',
    type: 'website',
    locale: 'en_IN',
    images: [{ url: 'https://launchgrid.in/og/sell-online.png', width: 1024, height: 1024 }],
  },
}

export default function SellOnlineHub() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <GrainOverlay />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl pt-16 md:pt-24 space-y-16">

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'HowTo',
                  name: 'How to sell online in India',
                  step: STEPS.map((st, i) => ({ '@type': 'HowToStep', position: i + 1, name: st.title, text: st.body })),
                },
                {
                  '@type': 'ItemList',
                  name: 'Sell online guides',
                  itemListElement: GUIDES.map(({ page }, i) => ({
                    '@type': 'ListItem',
                    position: i + 1,
                    url: `https://launchgrid.in/sell-online/${page.slug}`,
                  })),
                },
              ],
            }),
          }}
        />

        <div className="space-y-6 max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15]">
            How to sell online in India
          </h1>
          <p className="text-base md:text-lg text-[var(--color-mark-ink)] leading-relaxed">
            To sell online in India, pick a focused product range, price it so each order still makes money after
            shipping and COD returns, and take orders through your own store with UPI and Cash on Delivery at
            checkout. Then share the store link on WhatsApp and Instagram, where Indian buyers already are. The
            guides below cover each step for specific products and cities.
          </p>
          <a href="/onboarding" className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-xl shadow-md active:scale-95">
            Create your free store <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <section className="space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold font-playfair tracking-tight">Five steps to your first online order</h2>
          <ol className="space-y-4">
            {STEPS.map((st, i) => (
              <li key={st.title} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm flex gap-4">
                <span className="w-8 h-8 shrink-0 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">{i + 1}</span>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">{st.title}</h3>
                  <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed">{st.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-[var(--color-mark-secondary)]">
            Not sure what to charge? <a href="/tools/profit-margin-calculator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">Calculate your product profit margin</a>{' '}
            or <a href="/tools/invoice-generator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">create a GST invoice</a> for free.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)] flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> In-depth guides
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {GUIDES.map(({ page, guide }) => (
              <a key={page.slug} href={`/sell-online/${page.slug}`} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-2 hover:border-black/15 transition-colors group">
                <h3 className="font-bold text-base group-hover:underline underline-offset-4">{guide.h1}</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed">{guide.description}</p>
              </a>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)] flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> Sell online in your city
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
            <Tag className="w-3.5 h-3.5" /> Sell by product category
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
