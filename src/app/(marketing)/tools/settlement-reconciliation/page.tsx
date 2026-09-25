import type { Metadata } from 'next';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { ReconcileWorkspace } from '@/components/reconcile/ReconcileWorkspace';
import { getTool } from '@/data/tools';

/**
 * Its own static route rather than a `/tools/[slug]` entry.
 *
 * The generated route serves two families — calculators and documents — that
 * each have many members over one engine. This tool is a one-off with its own
 * shape, and special-casing a third branch inside that route to serve exactly
 * one page would make it harder to read for no saving.
 *
 * Static: the page ships as HTML, and every byte of work happens in the
 * visitor's browser on a file that never leaves it.
 */

const TOOL = getTool('settlement-reconciliation');

export const metadata: Metadata = {
  title: 'Marketplace Settlement Reconciliation',
  description:
    'Upload your Meesho, Amazon or Flipkart payout CSV and find the orders that do not add up — short settlements, odd commission, duplicates. Free, and your file never leaves your browser.',
  keywords: TOOL?.keywords,
  openGraph: {
    title: 'Marketplace Settlement Reconciliation | LaunchGrid',
    description:
      'Find the orders your marketplace payout file gets wrong. Runs entirely in your browser.',
    url: 'https://launchgrid.in/tools/settlement-reconciliation',
    siteName: 'LaunchGrid',
    type: 'website',
  },
  alternates: {
    canonical: 'https://launchgrid.in/tools/settlement-reconciliation',
  },
};

export default function SettlementReconciliationPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Marketplace Settlement Reconciliation',
    url: 'https://launchgrid.in/tools/settlement-reconciliation',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'Reconcile a marketplace payout file to find short settlements, commission outliers, duplicate order IDs and unsettled orders. Runs entirely in the browser.',
    inLanguage: 'en-IN',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    publisher: { '@id': 'https://launchgrid.in/#organization' },
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-20 sm:pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href="/tools"
              className="text-[11px] font-bold text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              ← All tools
            </Link>
          </nav>

          <header className="max-w-2xl mb-10">
            <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-3 block">
              Accounts
            </span>
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Check what your marketplace actually paid you
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              Payout files are unreadable, so almost nobody checks them. Drop
              yours in and we will find the orders that do not add up — settled
              short, commission above your normal rate, duplicated order IDs,
              sold but never paid.
            </p>
            <p className="mt-3 font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
              Free · no account · your file never leaves your browser
            </p>
          </header>

          <ReconcileWorkspace />

          <section className="mt-14 pt-8 border-t border-[var(--color-mark-default)] max-w-2xl">
            <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-3">
              What this can and cannot tell you
            </h2>
            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
              A payout file on its own cannot prove you were underpaid — that
              needs your own order records to compare against. What it can show
              is where the marketplace&rsquo;s own numbers contradict each other:
              a row whose settlement does not match its sale minus its fees, a
              commission far outside your usual rate, an order ID deducted
              twice, a delivered order that settled at nothing. Those are the
              ones worth raising.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
