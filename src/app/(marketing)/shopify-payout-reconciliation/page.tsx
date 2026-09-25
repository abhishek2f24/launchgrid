import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CircleDollarSign,
  Copy,
  Lock,
  Percent,
  Repeat,
  TrendingDown,
} from 'lucide-react';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { ReconcileWorkspace } from '@/components/reconcile/ReconcileWorkspace';
import { EarlyAccessForm } from '@/components/reconcile/EarlyAccessForm';

/**
 * The first ICP landing page: Shopify merchants using Shopify Payments.
 *
 * DELIBERATE CHOICES
 *   - The 54 tools are not mentioned above the fold, or anywhere near it. This
 *     page sells one thing.
 *   - The uploader is INLINE, not a link to /tools/settlement-reconciliation.
 *     Sending someone to a second page to do the thing the headline promised
 *     is the easiest conversion to lose.
 *   - No price. We do not know the conversion point yet; the first ten
 *     customers tell us that, not a pricing brainstorm. The paid tier is an
 *     early-access list.
 *   - The headline says payouts "match your sales", never "what Shopify
 *     actually paid you". A payout file alone cannot prove underpayment, and
 *     a headline that implies it would be a claim the product cannot keep.
 */

const CHECKS = [
  {
    icon: CircleDollarSign,
    title: 'Payout arithmetic',
    body: 'Does each transaction reconcile with its own amount, fees and deductions?',
  },
  {
    icon: Copy,
    title: 'Duplicate deductions',
    body: 'Transactions or deductions that appear more than once in the same report.',
  },
  {
    icon: Percent,
    title: 'Unexpected fees',
    body: 'Fee amounts that fall outside the normal pattern for your own store.',
  },
  {
    icon: TrendingDown,
    title: 'Missing or zero payouts',
    body: 'Completed transactions where the settlement does not look right.',
  },
  {
    icon: Repeat,
    title: 'Negative settlements',
    body: 'Transactions where money went the other way, or landed at an unusual value.',
  },
];

export const metadata: Metadata = {
  title: 'Shopify Payout Reconciliation — Check Your Payouts Match Your Sales',
  description:
    'Upload your Shopify Payments payout report and check it for duplicate deductions, unexpected fees and payout mismatches worth investigating. Free, no account, and your file is read in your browser.',
  keywords: [
    'shopify payout reconciliation',
    'shopify payments payout report',
    'reconcile shopify payouts',
    'shopify payout discrepancy',
    'shopify fees check',
  ],
  openGraph: {
    title: 'Are your Shopify Payments payouts adding up?',
    description:
      'Upload your payout report and find transactions worth investigating. Free, no account, read in your browser.',
    url: 'https://launchgrid.in/shopify-payout-reconciliation',
    siteName: 'LaunchGrid',
    type: 'website',
  },
  alternates: {
    canonical: 'https://launchgrid.in/shopify-payout-reconciliation',
  },
};

export default function ShopifyReconciliationPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LaunchGrid Reconcile for Shopify',
    url: 'https://launchgrid.in/shopify-payout-reconciliation',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description:
      'Check a Shopify Payments payout report for duplicate deductions, unexpected fees, payout mismatches and other anomalies worth investigating. Runs entirely in the browser.',
    inLanguage: 'en',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl">
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-[var(--color-mark-ink)] leading-[1.05] mb-5">
              Are your Shopify Payments payouts adding up?
            </h1>
            <p className="font-inter text-base md:text-lg font-bold text-[var(--color-mark-ink)] mb-4">
              Check whether your Shopify payouts match your sales.
            </p>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed max-w-2xl">
              Upload your Shopify Payments payout report and LaunchGrid checks
              the numbers for duplicate deductions, unexpected fees, payout
              mismatches and other anomalies worth investigating.
            </p>
            <p className="mt-4 font-inter text-xs font-bold text-[var(--color-mark-ink)]">
              Free to check. No account required.
            </p>
          </div>

          {/* The tool itself, inline */}
          <div className="mt-10">
            <ReconcileWorkspace />
          </div>

          <p className="mt-5 flex items-start gap-2 text-[11px] text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            Your file is read and checked inside your browser. It is not uploaded
            to our servers to run the reconciliation.
          </p>
        </section>

        {/* What it checks */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-8">
            What LaunchGrid checks
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CHECKS.map((check) => {
              const Icon = check.icon;
              return (
                <li
                  key={check.title}
                  className="bg-white rounded-[1.5rem] border border-[var(--color-mark-default)] p-6"
                >
                  <span className="w-10 h-10 rounded-xl bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <h3 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-2">
                    {check.title}
                  </h3>
                  <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
                    {check.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What you get — and the honesty line */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-4">
                See what we find
              </h2>
              <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed mb-5">
                Upload your Shopify Payments report and get a summary like this.
              </p>
              <div className="bg-[var(--color-mark-ink)] text-white rounded-[1.5rem] p-6 space-y-3">
                <p className="font-playfair text-3xl font-bold tabular-nums">
                  1,247 <span className="text-base font-normal text-white/60">transactions checked</span>
                </p>
                <p className="font-playfair text-3xl font-bold tabular-nums">
                  3 <span className="text-base font-normal text-white/60">findings worth investigating</span>
                </p>
                <p className="font-playfair text-3xl font-bold tabular-nums">
                  $266.00 <span className="text-base font-normal text-white/60">in transactions flagged</span>
                </p>
              </div>
            </div>

            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-6">
              <h3 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-3">
                What this does not claim
              </h3>
              <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-3">
                LaunchGrid does <strong>not</strong> claim that every flagged
                amount is money Shopify owes you. A payout report on its own
                cannot prove that — it would need your own order records to
                compare against.
              </p>
              <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
                What it does is find transactions that do not reconcile
                normally, so you can investigate them. Every number it shows is
                labelled &ldquo;worth checking&rdquo;, never &ldquo;owed&rdquo;.
              </p>
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="max-w-2xl">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-4">
              Your financial file stays in your browser
            </h2>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              LaunchGrid processes your uploaded file locally, in your browser.
              Your payout data does not need to be uploaded to our servers just
              to run the reconciliation. You can disconnect from the internet
              after this page loads and the check still works.
            </p>
          </div>
        </section>

        {/* Who it is for */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="max-w-2xl">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-4">
              Built for merchants who want to know where their money went
            </h2>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              If you sell through Shopify, your payout should be explainable.
              Sales, then fees, then adjustments, then payout. LaunchGrid helps
              you check that those numbers make sense.
            </p>
          </div>
        </section>

        {/* Early access */}
        <section className="max-w-6xl mx-auto px-6 mt-20">
          <div className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-8 md:p-10">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-3">
              Want to monitor every payout?
            </h2>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed max-w-2xl mb-6">
              Save your reconciliation history, compare payouts over time, and
              see fee trends across months rather than one report at a time.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-2xl mb-8">
              {[
                'Historical reconciliation',
                'Multiple Shopify stores',
                'Recurring payout checks',
                'Exportable reports',
                'Fee trend analysis',
                'Anomaly detection',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 font-inter text-xs text-[var(--color-mark-secondary)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mark-green)] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <EarlyAccessForm source="shopify-reconcile" />
            <p className="mt-3 font-inter text-[11px] text-[var(--color-mark-subtle-text)]">
              Early access. Nothing is charged, and we will ask what it is worth
              before setting a price.
            </p>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-6 mt-12">
          <p className="font-inter text-[11px] text-[var(--color-mark-subtle-text)]">
            Selling somewhere else?{' '}
            <Link
              href="/tools/settlement-reconciliation"
              className="font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              The same check works on Amazon, Etsy, eBay, Stripe and Meesho
              reports
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
