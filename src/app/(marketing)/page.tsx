import type { Metadata } from 'next';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { PLANS, type PlanTier } from '@/lib/plans';
import {
  INTENT_BUCKETS,
  liveTools,
  liveToolsInBucket,
  populatedBuckets,
} from '@/data/tools';

// Homepage = the tool grid. No narrative funnel.
//
// The previous homepage was a five-movement story (Proof → Pain → Method →
// Money → Door) that argued the visitor into the store product. It has been
// replaced by the catalogue itself: visitors self-select a tool instead of
// being told what they need.
//
// This page was the only consumer of S01_TheThought, S_ResearchToStore,
// S06_TheMethod, S05_TheMoney, RealStoresGallery, S_FAQ and S10_FinalCTA.
// Those components are now unreferenced. They are kept on disk deliberately so
// the narrative can be restored or reused on a landing page, but nothing
// renders them today — delete them once that decision is settled.
//
// Everything rendered here comes from src/data/tools.ts, filtered to
// status === 'live'. Nothing on this page advertises a tool that does not
// exist yet.

// Static apart from the registry, which is compile-time data. Revalidate daily
// so a deploy-free copy edit still lands within a day.
export const revalidate = 86400;

export const metadata: Metadata = {
  // `absolute` opts out of the root layout's '%s | LaunchGrid' template —
  // otherwise the brand name renders twice on the homepage.
  title: {
    absolute: 'LaunchGrid — Free Business Tools for Indian Sellers',
  },
  description:
    'Research products, price them, take payments and find customers. Free calculators and generators for Indian D2C, retail and WhatsApp sellers — most need no account.',
  keywords: [
    'free business tools india',
    'gst calculator',
    'profit margin calculator',
    'roas calculator',
    'product research india',
    'online store builder india',
    'whatsapp link generator',
  ],
  openGraph: {
    title: 'LaunchGrid — Free Business Tools for Indian Sellers',
    description:
      'Pick the tool you need: product research, GST, pricing, margins, ROAS, WhatsApp links, or a full online store.',
    url: 'https://launchgrid.in',
    siteName: 'LaunchGrid',
    type: 'website',
    // OG image served by file convention: src/app/opengraph-image.tsx
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LaunchGrid — Free Business Tools for Indian Sellers',
    description:
      'Pick the tool you need: product research, GST, pricing, margins, ROAS, WhatsApp links, or a full online store.',
  },
  alternates: {
    canonical: 'https://launchgrid.in',
  },
};

const SITE = 'https://launchgrid.in';

// Paid tiers, read from the plan source of truth so the structured data can
// never drift from what /pricing actually charges.
const PAID_TIERS: PlanTier[] = ['starter', 'pro', 'premium'];

export default function MarketingPage() {
  const tools = liveTools();
  const buckets = populatedBuckets();

  const planOffers = (['free', ...PAID_TIERS] as PlanTier[]).map((tier) => ({
    '@type': 'Offer',
    name: PLANS[tier].publicName,
    price: String(PLANS[tier].priceMonthly),
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: `${SITE}/pricing`,
  }));

  const schemaBlocks = [
    // BLOCK 1: Organization
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE}/#organization`,
      name: 'LaunchGrid',
      legalName: 'Launchgrid LLP',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/images/launchgrid-logo.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE}/images/launchgrid-og.png`,
      description:
        'LaunchGrid builds free business tools for Indian sellers — product research, GST and pricing calculators, WhatsApp links, and a full online store with UPI and COD checkout.',
      foundingDate: '2023',
      foundingLocation: {
        '@type': 'Place',
        address: { '@type': 'PostalAddress', addressCountry: 'IN' },
      },
      areaServed: { '@type': 'Country', name: 'India' },
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          availableLanguage: ['English', 'Hindi'],
          url: `${SITE}/support`,
        },
        {
          '@type': 'ContactPoint',
          contactType: 'sales',
          availableLanguage: ['English', 'Hindi'],
          url: `${SITE}/contact`,
        },
      ],
      sameAs: [
        'https://www.instagram.com/launchgrid',
        'https://www.facebook.com/launchgrid',
        'https://twitter.com/launchgrid',
        'https://www.linkedin.com/company/launchgrid',
        'https://www.youtube.com/@launchgrid',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'LaunchGrid Subscription Plans',
        itemListElement: planOffers,
      },
    },

    // BLOCK 2: WebSite
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE}/#website`,
      name: 'LaunchGrid',
      url: SITE,
      description:
        'Free business tools for Indian sellers: product research, GST, pricing, margins, ROAS, WhatsApp links and an online store.',
      inLanguage: ['en-IN', 'hi'],
      publisher: { '@id': `${SITE}/#organization` },
    },

    // BLOCK 3: SoftwareApplication
    //
    // `aggregateRating` was removed here deliberately. It previously claimed
    // 4.9 from 142 reviews with no review system behind it, which is both a
    // Google structured-data policy violation and inconsistent with this
    // codebase's existing rule against invented social proof.
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      '@id': `${SITE}/#software`,
      name: 'LaunchGrid',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE,
      description:
        'A catalogue of business tools for Indian sellers. Most tools run in the browser with no account; the online store adds UPI and COD checkout, GST invoicing and order management.',
      featureList: tools.map((tool) => tool.name),
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: String(
          Math.max(...PAID_TIERS.map((tier) => PLANS[tier].priceMonthly))
        ),
        priceCurrency: 'INR',
        offerCount: String(planOffers.length),
        offers: planOffers,
      },
      countriesSupported: 'IN',
      inLanguage: 'en-IN',
    },

    // BLOCK 4: ItemList — the grid itself, which is now the page's content.
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${SITE}/#tools`,
      name: 'LaunchGrid business tools',
      numberOfItems: tools.length,
      itemListElement: tools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        description: tool.description,
        url: `${SITE}${tool.href}`,
      })),
    },

    // BLOCK 5: WebPage
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${SITE}/#webpage`,
      url: SITE,
      name: 'LaunchGrid — Free Business Tools for Indian Sellers',
      description:
        'Pick the tool your business needs right now. Most are free and need no account.',
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.hero-headline', '.hero-subheadline'],
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        ],
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${SITE}/images/launchgrid-og.png`,
        width: 1200,
        height: 630,
      },
      inLanguage: 'en-IN',
      publisher: { '@id': `${SITE}/#organization` },
    },
  ];

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      {schemaBlocks.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <GrainOverlay />

      {/* Launch offer bar — first-10 concierge setup (drives /free-setup WhatsApp funnel) */}
      <a
        href="/free-setup?utm_source=homepage&utm_medium=announcement_bar"
        className="relative z-20 block w-full bg-[var(--color-mark-ink)] text-center py-2 px-4 text-[11px] sm:text-xs font-bold tracking-wide text-white hover:bg-neutral-800 transition-colors"
      >
        🆓 First 10 businesses: we set up your entire store for you — free.{' '}
        <span className="underline underline-offset-2 decoration-white/40">
          Claim your spot →
        </span>
      </a>

      <JourneyNav />

      <main className="flex-1 w-full overflow-x-clip pt-20 sm:pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header — one sentence of positioning, then straight into the grid. */}
          <header className="text-center max-w-3xl mx-auto mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-4 block">
              {tools.length} tools · built for India
            </span>
            <h1 className="hero-headline font-playfair text-4xl md:text-6xl font-bold text-[var(--color-mark-ink)] leading-[1.05] mb-5">
              Everything your business needs, in one place.
            </h1>
            <p className="hero-subheadline font-inter text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed">
              Pick what you need right now. Most tools are free, work in your
              browser, and need no account.
            </p>
          </header>

          {/* The grid, grouped by what the business is trying to do. */}
          <div className="space-y-20">
            {buckets.map((bucketId) => {
              const bucket = INTENT_BUCKETS[bucketId];
              const bucketTools = liveToolsInBucket(bucketId);

              return (
                <section key={bucketId} aria-labelledby={`bucket-${bucketId}`}>
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 border-b border-[var(--color-mark-default)] pb-4 mb-8">
                    <h2
                      id={`bucket-${bucketId}`}
                      className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)]"
                    >
                      {bucket.label}
                    </h2>
                    <p className="font-inter text-xs text-[var(--color-mark-subtle-text)] sm:text-right">
                      {bucket.blurb}
                    </p>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bucketTools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <li key={tool.slug}>
                          <Link
                            href={tool.href}
                            className="group h-full flex flex-col bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-7 shadow-[0_8px_30px_rgba(26,26,24,0.03)] hover:shadow-[0_16px_48px_rgba(26,26,24,0.07)] hover:-translate-y-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-mark-ink)]"
                          >
                            <div className="flex items-start justify-between mb-5">
                              <span className="w-12 h-12 rounded-2xl bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5" aria-hidden="true" />
                              </span>
                              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--color-mark-subtle-text)] bg-[var(--color-mark-subtle)] px-3 py-1 rounded-full">
                                {tool.badge}
                              </span>
                            </div>

                            <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                              {tool.shortName ?? tool.name}
                            </h3>

                            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-6 flex-1">
                              {tool.description}
                            </p>

                            <div className="flex items-center justify-between">
                              <span className="font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
                                {tool.requiresAccount
                                  ? 'Free plan · account needed'
                                  : 'Free · no account'}
                              </span>
                              <span
                                aria-hidden="true"
                                className="font-inter text-xs font-bold text-[var(--color-mark-ink)] group-hover:translate-x-0.5 transition-transform"
                              >
                                →
                              </span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          {/* Two plain links out. No pitch. */}
          <nav
            aria-label="More"
            className="mt-20 pt-10 border-t border-[var(--color-mark-default)] flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            <Link
              href="/apps"
              className="font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Android apps
            </Link>
            <Link
              href="/pricing"
              className="font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Plans &amp; pricing
            </Link>
            <Link
              href="/faq"
              className="font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Common questions
            </Link>
            <Link
              href="/login"
              className="font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Log in
            </Link>
          </nav>
        </div>
      </main>

      <Footer />
    </div>
  );
}
