import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { APPS, appsByCategory } from '@/data/apps';
import { appIcon } from '@/lib/apps/assets';

/**
 * The app directory.
 *
 * Same principle as the tool grid: show what exists, grouped by what someone
 * is trying to do, rather than a pitch. This is the page that gives seven
 * separately-published apps a shared address and internal links — which is the
 * whole visibility problem.
 */

const SITE = 'https://launchgrid.in';

export const metadata: Metadata = {
  title: { absolute: 'LaunchGrid Apps — Private, offline-first Android apps' },
  description:
    'Seven Android apps from LaunchGrid: GST compliance, family organisation, legal matters, message scheduling, medication, cycle tracking and hydration. No accounts, no ads, and your data stays on your device.',
  keywords: [
    'launchgrid apps',
    'offline android apps india',
    'private android apps no account',
    'ad free android apps',
  ],
  openGraph: {
    title: 'LaunchGrid Apps',
    description:
      'Private, offline-first Android apps. No accounts, no ads, data stays on your device.',
    url: `${SITE}/apps`,
    siteName: 'LaunchGrid',
    type: 'website',
  },
  alternates: { canonical: `${SITE}/apps` },
};

export default function AppsDirectoryPage() {
  const groups = appsByCategory();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'LaunchGrid apps',
    numberOfItems: APPS.length,
    itemListElement: APPS.map((app, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: app.name,
      description: app.tagline,
      url: `${SITE}/apps/${app.slug}`,
    })),
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
          <header className="max-w-2xl mb-14">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-4 block">
              {APPS.length} apps
            </span>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-[var(--color-mark-ink)] leading-[1.05] mb-5">
              Apps that keep your data on your phone.
            </h1>
            <p className="font-inter text-sm md:text-base text-[var(--color-mark-secondary)] leading-relaxed">
              Every app here works without an account, without ads, and without
              sending what you enter to a server. Pick the one that solves your
              problem.
            </p>
          </header>

          <div className="space-y-16">
            {groups.map(({ category, apps }) => (
              <section key={category} aria-labelledby={`cat-${category.replace(/\W+/g, '-')}`}>
                <h2
                  id={`cat-${category.replace(/\W+/g, '-')}`}
                  className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] border-b border-[var(--color-mark-default)] pb-4 mb-8"
                >
                  {category}
                </h2>

                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apps.map((app) => {
                    const icon = appIcon(app.slug);
                    const Icon = app.icon;
                    return (
                      <li key={app.slug}>
                        <Link
                          href={`/apps/${app.slug}`}
                          className="group h-full flex flex-col bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-7 shadow-[0_8px_30px_rgba(26,26,24,0.03)] hover:shadow-[0_16px_48px_rgba(26,26,24,0.07)] hover:-translate-y-1 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-mark-ink)]"
                        >
                          <span className="w-12 h-12 rounded-2xl bg-[var(--color-mark-subtle)] flex items-center justify-center shrink-0 mb-5 overflow-hidden">
                            {icon ? (
                              <Image src={icon} alt="" width={48} height={48} className="w-full h-full object-cover" />
                            ) : (
                              <Icon className="w-5 h-5 text-[var(--color-mark-ink)]" aria-hidden="true" />
                            )}
                          </span>

                          <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-2">
                            {app.name}
                          </h3>
                          <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed flex-1">
                            {app.tagline}
                          </p>

                          <div className="mt-5 flex items-center justify-between">
                            <span className="font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
                              {app.price}
                            </span>
                            <span aria-hidden="true" className="font-inter text-xs font-bold text-[var(--color-mark-ink)] group-hover:translate-x-0.5 transition-transform">
                              →
                            </span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <section className="mt-20 pt-10 border-t border-[var(--color-mark-default)] max-w-2xl">
            <h2 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
              Why none of them ask you to sign up
            </h2>
            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
              An app that stores your medication schedule, your cycle, your
              clients&rsquo; GSTINs or your case notes has no business keeping them on
              someone else&rsquo;s server. Each of these apps holds its data in private
              storage on your own device, which is also why none of them need an
              account and none of them carry ads.
            </p>
            <p className="mt-4 font-inter text-[11px] text-[var(--color-mark-subtle-text)]">
              Looking for browser tools instead?{' '}
              <Link href="/tools" className="font-bold hover:text-[var(--color-mark-ink)] transition-colors">
                LaunchGrid has 54 free business tools
              </Link>
              .
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
