/**
 * The page shell every document tool shares.
 *
 * The three routes differ only by `kind` — chrome, layout, heading and
 * structured data all come from here, so adding the next document type is a
 * `kinds.ts` entry, a registry entry and a four-line page file.
 */

import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { DocumentWorkspace } from './DocumentWorkspace';
import { DOCUMENT_KINDS, documentSlug } from '@/lib/documents/kinds';
import type { DocumentKind } from '@/lib/documents/types';

const SITE = 'https://launchgrid.in';

export function DocumentToolPage({ kind }: { kind: DocumentKind }) {
  const config = DOCUMENT_KINDS[kind];
  const url = `${SITE}/tools/${documentSlug(kind)}`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: config.pageTitle,
    url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: config.pageDescription,
    inLanguage: 'en-IN',
    // The tool genuinely costs nothing and needs no account, so this offer is
    // accurate rather than promotional.
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    publisher: { '@id': `${SITE}/#organization` },
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
        <div className="max-w-7xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href="/tools"
              className="text-[11px] font-bold text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              ← All tools
            </Link>
          </nav>

          <header className="max-w-2xl mb-10">
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              {config.pageTitle}
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              {config.pageDescription}
            </p>
            <p className="mt-3 font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
              Free · no account · nothing you type leaves your browser
            </p>
            {config.shape === 'letter' && (
              <p className="mt-3 font-inter text-[11px] text-[var(--color-mark-secondary)] leading-relaxed bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-xl p-3">
                This is a commonly used format, not legal advice. An employment
                document that matters should be read by someone qualified before
                it goes out.
              </p>
            )}
          </header>

          <DocumentWorkspace kind={kind} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
