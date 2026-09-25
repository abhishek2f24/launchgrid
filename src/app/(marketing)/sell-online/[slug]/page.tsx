import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { ArrowRight, Sparkles, Store, Smartphone, Truck, Receipt, MessageSquare, ShoppingCart, HelpCircle } from 'lucide-react'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { ALL_SEO_PAGES, CATEGORY_PAGES, CITY_PAGES, getSeoPage, SeoPage } from '@/lib/seo-pages'
import { getGuide, isIndexableSeoPage, SellGuide } from '@/lib/sell-online-guides'

const SITE = 'https://launchgrid.in'
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

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

  const guide = getGuide(page.slug)
  const title = guide?.title ?? pageTitle(page)
  const description = guide?.description ?? pageDescription(page)
  const url = `${SITE}/sell-online/${page.slug}`

  return {
    title: guide ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    // Template-only pages stay reachable but out of the index until they get a
    // real guide — see src/lib/sell-online-guides.ts for why.
    ...(guide ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url,
      type: guide ? 'article' : 'website',
      locale: 'en_IN',
      images: [{ url: `${SITE}/og/sell-online.png`, width: 1024, height: 1024 }],
    },
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

  const guide = getGuide(page.slug)
  if (guide) return <GuidePage page={page} guide={guide} />

  const title = pageTitle(page)
  const faqs = buildFaqs(page)
  const isCity = page.type === 'city'

  // Internal link mesh: every page links 6 cities + 6 categories
  const idx = ALL_SEO_PAGES.findIndex(p => p.slug === page.slug)
  const relatedCities = CITY_PAGES.filter(p => p.slug !== page.slug)
    .slice(idx % 8, (idx % 8) + 6)
  const relatedCategories = CATEGORY_PAGES.filter(p => p.slug !== page.slug)
    .slice(idx % 4, (idx % 4) + 6)
  // Always include the in-depth guides, so crawl paths lead to indexable pages.
  const guideLinks = ALL_SEO_PAGES.filter(p => p.slug !== page.slug && isIndexableSeoPage(p.slug))

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
          { '@type': 'ListItem', position: 3, name: page.name, item: `https://launchgrid.in/sell-online/${page.slug}` },
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
            {guideLinks.map(c => (
              <a key={`g-${c.slug}`} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-black text-white rounded-full text-xs font-bold hover:bg-neutral-800 transition-colors">
                {guideAnchor(c)}
              </a>
            ))}
            {relatedCities.filter(c => !isIndexableSeoPage(c.slug)).map(c => (
              <a key={c.slug} href={`/sell-online/${c.slug}`} className="px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-bold text-[var(--color-mark-secondary)] hover:text-black hover:border-black/15 transition-colors">
                Sell online in {c.name}
              </a>
            ))}
            {relatedCategories.filter(c => !isIndexableSeoPage(c.slug)).map(c => (
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

function guideAnchor(p: SeoPage): string {
  return p.type === 'city' ? `Sell online in ${p.name}` : `Sell ${p.name.toLowerCase()} online`
}

const card = 'p-6 bg-white border border-black/5 rounded-2xl shadow-sm'
const eyebrow = 'text-xs font-black uppercase tracking-[0.2em] text-[var(--color-mark-secondary)]'
const h2 = 'text-2xl md:text-3xl font-bold font-playfair tracking-tight text-[var(--color-mark-ink)]'
const body = 'text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed'
const inlineLink = 'font-bold underline underline-offset-2 text-[var(--color-mark-ink)]'

function GuidePage({ page, guide }: { page: SeoPage; guide: SellGuide }) {
  const url = `${SITE}/sell-online/${page.slug}`
  const isCity = page.type === 'city'
  const updated = new Date(guide.updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const related = guide.related
    .map(slug => ALL_SEO_PAGES.find(p => p.slug === slug))
    .filter((p): p is SeoPage => !!p)
  const otherGuides = ALL_SEO_PAGES.filter(
    p => p.slug !== page.slug && isIndexableSeoPage(p.slug) && !guide.related.includes(p.slug),
  )

  const schemaJson = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: guide.h1,
        description: guide.description,
        mainEntityOfPage: url,
        dateModified: guide.updated,
        inLanguage: 'en-IN',
        author: { '@type': 'Organization', name: 'LaunchGrid', url: SITE },
        publisher: { '@id': `${SITE}/#organization` },
        about: isCity
          ? { '@type': 'City', name: page.name, containedInPlace: { '@type': 'State', name: page.state } }
          : { '@type': 'Thing', name: page.name },
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Sell Online', item: `${SITE}/sell-online` },
          { '@type': 'ListItem', position: 3, name: page.name, item: url },
        ],
      },
    ],
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-ink)] font-inter relative pb-24 overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }} />
      <GrainOverlay />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl pointer-events-none z-0" />

      <article className="relative z-10 container mx-auto px-6 md:px-12 max-w-4xl pt-16 md:pt-24 space-y-16">

        <nav aria-label="Breadcrumb" className="text-xs font-bold text-[var(--color-mark-secondary)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><a href="/" className="hover:text-black">Home</a></li>
            <li aria-hidden="true">/</li>
            <li><a href="/sell-online" className="hover:text-black">Sell online</a></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--color-mark-ink)]">{page.name}</li>
          </ol>
        </nav>

        <header className="space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full border border-black/5 bg-white text-[10px] font-black uppercase tracking-widest text-[var(--color-mark-secondary)]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            {isCity ? `${page.name}, ${page.state}` : `Guide for ${page.name.toLowerCase()} sellers`}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-playfair leading-[1.15]">
            {guide.h1}
          </h1>
          <p className="text-base md:text-lg text-[var(--color-mark-ink)] leading-relaxed">
            {guide.answer}
          </p>
          <p className="text-xs text-[var(--color-mark-secondary)]">
            By the LaunchGrid team · Updated <time dateTime={guide.updated}>{updated}</time>
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a href="/onboarding" className="inline-flex items-center gap-2 px-7 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-xl shadow-md active:scale-95">
              {isCity ? `Start selling online in ${page.name}` : `Start selling ${page.name.toLowerCase()} online`} <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/tools/profit-margin-calculator" className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-black transition-colors">
              Calculate your profit margin →
            </a>
          </div>
        </header>

        <nav aria-label="On this page" className={`${card} space-y-3`}>
          <p className={eyebrow}>In this guide</p>
          <ol className="list-decimal pl-5 space-y-1.5 text-sm">
            {guide.sections.map((sec, i) => (
              <li key={sec.heading}><a href={`#s${i + 1}`} className="hover:underline underline-offset-2">{sec.heading}</a></li>
            ))}
            {guide.economics && <li><a href="#economics" className="hover:underline underline-offset-2">Worked example: what one order earns</a></li>}
            <li><a href="#faq" className="hover:underline underline-offset-2">Frequently asked questions</a></li>
          </ol>
        </nav>

        {guide.sections.map((sec, i) => (
          <section key={sec.heading} id={`s${i + 1}`} className="space-y-4 scroll-mt-24">
            <h2 className={h2}>{sec.heading}</h2>
            {sec.paragraphs.map((para, j) => <p key={j} className={body}>{para}</p>)}
            {sec.bullets && (
              <ul className={`list-disc pl-6 space-y-1.5 ${body}`}>
                {sec.bullets.map(b => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}

        {guide.economics && (
          <section id="economics" className="space-y-4 scroll-mt-24">
            <h2 className={h2}>Worked example: what one order actually earns</h2>
            <p className={body}>{guide.economics.caption}</p>
            <div className="overflow-x-auto bg-white border border-black/5 rounded-2xl shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.03]">
                  <tr>
                    {['Product', 'Cost', 'Price', 'Shipping', 'Packaging', 'Fees & returns', 'Net profit', 'Net margin'].map(h => (
                      <th key={h} scope="col" className="p-3 font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.economics.rows.map(r => {
                    const net = r.price - r.cost - r.shipping - r.packaging - r.other
                    return (
                      <tr key={r.item} className="border-t border-black/5">
                        <th scope="row" className="p-3 font-bold">{r.item}</th>
                        <td className="p-3">{inr(r.cost)}</td>
                        <td className="p-3">{inr(r.price)}</td>
                        <td className="p-3">{inr(r.shipping)}</td>
                        <td className="p-3">{inr(r.packaging)}</td>
                        <td className="p-3">{inr(r.other)}</td>
                        <td className="p-3 font-bold">{inr(net)}</td>
                        <td className="p-3 font-bold">{Math.round((net / r.price) * 100)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[var(--color-mark-secondary)]">
              Prices are before GST. Plug in your own numbers with the{' '}
              <a href="/tools/profit-margin-calculator" className={inlineLink}>free profit margin calculator</a>.
            </p>
          </section>
        )}

        <section className="space-y-6">
          <h2 className={h2}>Free tools for this step</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {guide.tools.map(t => (
              <a key={t.href} href={t.href} className={`${card} flex items-center justify-between gap-3 hover:border-black/15 transition-colors group`}>
                <span className="font-bold text-sm group-hover:underline underline-offset-4">{t.label}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className={h2}>How LaunchGrid handles the selling part</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <a key={f.href} href={f.href} className={`${card} space-y-3 hover:border-black/15 transition-colors group`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[var(--color-mark-ink)]" />
                    </div>
                    <h3 className="font-bold text-sm group-hover:underline underline-offset-4">{f.title}</h3>
                  </div>
                  <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed">{f.desc}</p>
                </a>
              )
            })}
          </div>
        </section>

        <section id="faq" className="space-y-6 scroll-mt-24">
          <h2 className={h2}>Frequently asked questions</h2>
          <div className="space-y-4">
            {guide.faqs.map(faq => (
              <div key={faq.q} className={`${card} space-y-2`}>
                <h3 className="font-bold text-sm flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--color-mark-secondary)]" /> {faq.q}
                </h3>
                <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 border-t border-black/5 pt-10">
          <h2 className={eyebrow}>Keep reading</h2>
          <ul className="space-y-2 text-sm">
            {guide.reading.map(r => (
              <li key={r.href}><a href={r.href} className={inlineLink}>{r.label}</a></li>
            ))}
            {related.map(r => (
              <li key={r.slug}><a href={`/sell-online/${r.slug}`} className={inlineLink}>{guideAnchor(r)}</a></li>
            ))}
            {otherGuides.map(r => (
              <li key={r.slug}><a href={`/sell-online/${r.slug}`} className={inlineLink}>{guideAnchor(r)}</a></li>
            ))}
          </ul>
        </section>

        <div className="p-8 md:p-12 bg-gradient-to-br from-black to-neutral-900 text-white rounded-[2rem] shadow-xl text-center space-y-6 relative overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-bold font-playfair tracking-tight">
            {isCity ? `Your ${page.name} store could be live tonight.` : `Your ${page.noun} could be live tonight.`}
          </h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-md mx-auto leading-relaxed">
            <Truck className="w-4 h-4 inline-block mr-1 -mt-0.5" />
            Free to start. UPI, COD, GST invoices and WhatsApp selling included.
          </p>
          <div className="pt-2">
            <a href="/onboarding" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-neutral-100 transition-all rounded-xl shadow-md active:scale-95">
              Create your free store <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </article>
    </div>
  )
}
