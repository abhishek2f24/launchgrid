import type { Metadata } from 'next';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { QrWorkspace } from '@/components/codes/QrWorkspace';

/**
 * The STATIC QR generator: the code carries the destination itself, so it
 * works forever and needs no account — but the destination cannot be changed
 * once printed. The dynamic version (editable destination, scan analytics)
 * stays on the roadmap because it needs an edge redirect, a database and an
 * account, and the two must never be confused in the copy.
 */

export const metadata: Metadata = {
  title: 'QR Code Generator',
  description:
    'Make a free QR code for your website, UPI payment, WhatsApp chat, Google review, Wi-Fi or contact card. Download as PNG or print-ready SVG. Nothing you type leaves your browser.',
  keywords: [
    'qr code generator',
    'upi qr code generator',
    'whatsapp qr code',
    'google review qr code',
    'wifi qr code generator',
    'free qr code india',
  ],
  openGraph: {
    title: 'QR Code Generator | LaunchGrid',
    description:
      'Free QR codes for UPI, WhatsApp, Google reviews, Wi-Fi and more. Generated in your browser.',
    url: 'https://launchgrid.in/tools/qr-code-generator',
    siteName: 'LaunchGrid',
    type: 'website',
  },
  alternates: { canonical: 'https://launchgrid.in/tools/qr-code-generator' },
};

export default function QrCodeGeneratorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'QR Code Generator',
    url: 'https://launchgrid.in/tools/qr-code-generator',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Generate QR codes for websites, UPI payments, WhatsApp, Google reviews, Wi-Fi and contact cards. Runs entirely in the browser.',
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
              Growth Tool
            </span>
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              QR Code Generator
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              One code for whatever you need it to do — take a UPI payment, open
              a WhatsApp chat, ask for a Google review, share your Wi-Fi, or
              point at your menu. Download it as a print-ready SVG.
            </p>
            <p className="mt-3 font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
              Free · no account · generated in your browser
            </p>
          </header>

          <QrWorkspace />

          <section className="mt-14 pt-8 border-t border-[var(--color-mark-default)] max-w-2xl">
            <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-3">
              Before you print it
            </h2>
            <ul className="space-y-2 font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
              <li>
                <strong className="text-[var(--color-mark-ink)]">
                  The destination is fixed.
                </strong>{' '}
                This code contains the link itself, so it works forever and needs
                no account — but you cannot change where it points after
                printing. If the destination might change, print a link you
                control and can redirect.
              </li>
              <li>
                <strong className="text-[var(--color-mark-ink)]">
                  Keep the white border.
                </strong>{' '}
                Scanners need the quiet zone around the code. It is included in
                the download — do not crop it away.
              </li>
              <li>
                <strong className="text-[var(--color-mark-ink)]">
                  Test with two phones
                </strong>{' '}
                before you print a hundred of anything, and print at least 2cm
                across for a table or counter.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
