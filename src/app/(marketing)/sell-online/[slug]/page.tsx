import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ArrowRight, Sparkles, Store, Smartphone, Truck, Receipt, MessageSquare, ShoppingCart, HelpCircle } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { ALL_SEO_PAGES, CATEGORY_PAGES, CITY_PAGES, getSeoPage, SeoPage } from '@/lib/seo-pages'

export const dynamicParams = false

export async function generateStaticParams() {
  return ALL_SEO_PAGES.map(p => ({ slug: p.slug }))
}

function pageTitle(page: SeoPage): string {
  return page.type === 'city'
    ? `Sell Online in ${page.name} — Store Live in 15 Minutes`
    : `Sell ${page.name} Online — Your Own ${capitalize(page.noun)} in 15 Minutes`
}

function pageDescription(page: SeoPage): string {
  return page.type === 'city'
    ? `Create your online store in ${page.name} with UPI, COD, GST invoices and WhatsApp selling built in. No coding, no agency fees — live in 15 minutes on LaunchGrid.`
    : `Start selling ${page.name.toLowerCase()} online with your own ${page.noun}. UPI & COD checkout, GST invoices, WhatsApp sharing — live in 15 minutes on LaunchGrid.`
}

function capitalize(s: string): string {
  return s.replace(/(^|\s)\w/g, c => c.toUpperCase())
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const page = getSeoPage(params.slug)
  if (!page) return {}

  const title = pageTitle(page)
  const description = pageDescription(page)
  const url = `https://launchgrid.in/sell-online/${page.slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website' },
  }
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Sign up & name your store', desc: 'Pick your store name and get a free yourname.launchgrid.in address instantly. No domain purchase needed to start.' },
  { step: '2', title: 'Add products from your phone', desc: 'Photograph your products or paste a link to import them. Set prices, stock and delivery — all from mobile.' },
  { step: '3', title: 'Share & take orders', desc: 'Share your store link on WhatsApp status, Instagram bio and customer groups. Orders, payments and invoices are handled for you.' },
]

const FEATURES = [
  { icon: ShoppingCart, title: 'One-page UPI checkout', desc: 'GPay, PhonePe, Paytm — buyers pay in one tap. COD available for first-time customer trust.', href: '/features/one-click-checkout' },
  { icon: Receipt, title: 'Automatic GST invoices', desc: 'CGST/SGST/IGST split correctly by buyer state, with print-ready invoices on every order.', href: '/features/gst-invoicing' },
  { icon: MessageSquare, title: 'WhatsApp selling tools', desc: 'Broadcast promos, send order updates and recover abandoned carts where Indian buyers actually are.', href: '/features/whatsapp-marketing' },
  { icon: Smartphone, title: 'Manage from your phone', desc: 'Order alerts on your lock screen, one-tap fulfilment and product updates from the LaunchGrid Android app.', href: '/pricing' },
]

function buildFaqs(page: SeoPage): { q: string; a: string }[] {
  const subject = page.type === 'city' ? `in ${page.name}` : page.name.toLowerCase()
  return [
    {
      q: page.type === 'city'
        ? `How do I create an online store in ${page.name}?`
        : `How do I start selling ${subject} online?`,
      a: `Sign up on LaunchGrid, name your store, and add products from your phone — most sellers go live in about 15 minutes. You get a free store address (yourname.launchgrid.in), UPI and COD checkout, and GST-ready invoicing from day one. No coding and no agency required.`,
    },
    {
      q: `Do my customers get Cash on Delivery (COD)?`,
      a: `Yes. COD is built in and you can enable or disable it per store. ${page.type === 'city' ? `For new stores in ${page.name}, COD typically lifts first-order conversion significantly because buyers trust it before they know your brand.` : `For ${subject}, COD is often the difference between a hesitant browser and a confirmed first order.`}`,
    },
    {
      q: `Do I need a GST number to start?`,
      a: `You can start selling under the GST exemption threshold without a GSTIN. Once you register, LaunchGrid automatically applies the right CGST/SGST/IGST split based on the buyer's state and generates compliant invoices.`,
    },
    {
      q: page.type === 'city'
        ? `How much does an online store cost in ${page.name}?`
        : `How much does it cost to sell ${subject} online?`,
      a: `LaunchGrid has a free tier to get started and transparent paid plans listed on our pricing page — no quotes, no agency retainers, no hidden development fees. Compare that to ₹15,000–50,000 for a typical agency-built website that you can't edit yourself.`,
    },
  ]
}

export default async function SellOnlinePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const page = getSeoPage(params.slug)
  if (!page) notFound()

  const title = pageTitle(page)
  const faqs = buildFaqs(page)
  const isCity = page.type === 'city'

  // Internal link mesh: every page links 6 cities + 6 categories
  const idx = ALL_SEO_PAGES.findIndex(p => p.slug === page.slug)
  const relatedCities = CITY_PAGES.filter(p => p.slug !== page.slug)
    .slice(idx % 8, (idx % 8) + 6)
  const relatedCategories = CATEGORY_PAGES.filter(p => p.slug !== page.slug)
    .slice(idx % 4, (idx % 4) + 6)

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://launchgrid.in' },
          { '@type': 'ListItem', position: 2, name: 'Sell Online', item: 'https://launchgrid.in/sell-online' },
          { '@type': 'ListItem', position: 3, name: isCity ? page.name : page.name, item: `https://launchgrid.in/sell-online/${page.slug}` },
        ],
      },
    ],
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />
      <GrainOverlay />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 max-w-5xl pt-16 md:pt-24 space-y-20">

        {/* Breadcrumb */}
        <div>
          <a href="/sell-online" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-black transition-colors">
            ← Sell online with LaunchGrid
          </a>
        </div>

        {/* Hero */}
        <div className="space-y-6 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {isCity ? `${page.name}, ${page.state}` : `${page.name} sellers`}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15]">
            {title}
          </h1>
          <p className="text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed font-medium">
            {page.flavor}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="/onboarding" className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-xl shadow-md active:scale-95">
              Create your free store <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/pricing" className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-black transition-colors">
              See transparent pricing →
            </a>
          </div>
        </div>

        {/* Who this is for */}
        <div className="space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">
            {isCity ? `Built for ${page.name} businesses` : `Built for ${page.name.toLowerCase()} sellers`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {page.examples.map((example, i) => (
              <div key={i} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                  <Store className="w-4 h-4 text-[var(--color-mark-ink)]" />
                </div>
                <h3 className="font-bold text-sm text-[var(--color-mark-ink)]">{example}</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">
                  Get a storefront with photos, prices and one-tap checkout — share it on WhatsApp and start taking orders today.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Live in three steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-3">
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold text-sm">{s.step}</div>
                <h3 className="font-bold text-sm text-[var(--color-mark-ink)]">{s.title}</h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <div className="space-y-8">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Everything an Indian seller needs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <a key={i} href={f.href} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-3 hover:border-black/15 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[var(--color-mark-ink)]" />
                    </div>
                    <h3 className="font-bold text-sm text-[var(--color-mark-ink)] group-hover:underline underline-offset-4">{f.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium">{f.desc}</p>
                </a>
              )
            })}
          </div>
        </div>

        {/* Why not an agency */}
        <div className="p-8 bg-white border border-black/5 rounded-2xl shadow-sm space-y-4 max-w-3xl">
          <h2 className="text-lg font-bold font-playfair tracking-tight">Why pay an agency ₹20,000 for a website you can't edit?</h2>
          <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed font-medium">
            A typical agency-built site costs ₹15,000–50,000 upfront, takes weeks, and every product change means
            calling the developer. With LaunchGrid you own your store: change prices at midnight, add products from
            your phone{isCity ? ` while sitting in your ${page.name} shop` : ''}, and watch live visitor and order
            stats — starting free. <a href="/vs-dukaan" className="underline underline-offset-2 font-bold text-[var(--color-mark-ink)]">Compare platforms →</a>
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-8 max-w-3xl">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 bg-white border border-black/5 rounded-2xl shadow-sm space-y-2">
                <h3 className="font-bold text-sm text-[var(--color-mark-ink)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[var(--color-mark-secondary)]" /> {faq.q}
                </h3>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed font-medium pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Internal links */}
        <div className="space-y-6 border-t border-black/5 pt-10">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]">Sell online anywhere, in any category</h2>
          <div className="flex flex-wrap gap-2">
            {relatedCities.map(c => (
              <a key={c.slug} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[var(--color-mark-secondary)] hover:text-black hover:border-black/15 transition-colors">
                Sell online in {c.name}
              </a>
            ))}
            {relatedCategories.map(c => (
              <a key={c.slug} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[var(--color-mark-secondary)] hover:text-black hover:border-black/15 transition-colors">
                Sell {c.name.toLowerCase()} online
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="p-8 md:p-12 bg-gradient-to-br from-black to-neutral-900 text-white rounded-[2rem] shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-bold font-playfair tracking-tight">
            {isCity ? `Your ${page.name} store could be live tonight.` : `Your ${page.noun} could be live tonight.`}
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
            <Truck className="w-4 h-4 inline-block mr-1 -mt-0.5" />
            Free to start. UPI, COD, GST invoices and WhatsApp selling included. Live in 15 minutes.
          </p>
          <div className="pt-2">
            <a href="/onboarding" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all rounded-xl shadow-md active:scale-95">
              Start for Free <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
