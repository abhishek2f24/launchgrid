/**
 * The page chrome every generated tool shares: nav, breadcrumb, heading,
 * structured data, use cases, footer.
 *
 * Extracted when the generator engine arrived and a second branch of
 * `/tools/[slug]` needed the same frame. The workspace is passed as children,
 * so a third engine is a branch plus a component — not another copy of this.
 */

import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

export function ToolShell({
  slug,
  badge,
  title,
  description,
  useCases,
  /** schema.org applicationCategory — finance tools declare themselves as such. */
  schemaCategory = 'BusinessApplication',
  /** The line under the heading. Says what the tool does with your data. */
  privacyLine = 'Free · no account · runs in your browser',
  children,
}: {
  slug: string;
  badge: string;
  title: string;
  description: string;
  useCases: string[];
  schemaCategory?: string;
  privacyLine?: string;
  children: React.ReactNode;
}) {
  const url = `https://launchgrid.in/tools/${slug}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://launchgrid.in' },
      { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://launchgrid.in/tools' },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: title,
    url,
    applicationCategory: schemaCategory,
    operatingSystem: 'Web',
    description,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
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
              {badge}
            </span>
            <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              {title}
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              {description}
            </p>
            <p className="mt-3 font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
              {privacyLine}
            </p>
          </header>

          {children}

          {useCases.length > 0 && (
            <section className="mt-12 pt-8 border-t border-[var(--color-mark-default)] max-w-2xl">
              <h2 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-3">
                What people use this for
              </h2>
              <ul className="space-y-1.5">
                {useCases.map((useCase) => (
                  <li
                    key={useCase}
                    className="flex items-center gap-2 font-inter text-xs text-[var(--color-mark-secondary)]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mark-green)] shrink-0" />
                    {useCase}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
