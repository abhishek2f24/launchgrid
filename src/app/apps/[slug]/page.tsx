import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Check, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { APPS, getApp } from '@/data/apps';
import { appFeatureGraphic, appIcon, appScreenshots } from '@/lib/apps/assets';

/**
 * One page per app, at /apps/<slug>.
 *
 * COEXISTS WITH THE POLICY ROUTES
 *   /apps/<slug>/privacy-policy.html is either a static route handler or a file
 *   in public/. Both take precedence over this dynamic segment, so the policies
 *   keep working untouched — which matters, because those URLs are already
 *   submitted to Play Console and must not move.
 *
 * STRUCTURED DATA IS FACTUAL OR ABSENT
 *   aggregateRating is emitted only when a real rating AND a real review count
 *   are present in the registry. See the warning at the top of data/apps.ts:
 *   an invented rating is a Google policy violation that would bury these
 *   pages, which is the opposite of the point.
 */

const SITE = 'https://launchgrid.in';

export const dynamicParams = false;

export function generateStaticParams() {
  return APPS.map((app) => ({ slug: app.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const app = getApp(slug);
  if (!app) return {};

  const title = `${app.name} — ${app.tagline}`;
  return {
    title,
    description: app.description,
    keywords: app.keywords,
    openGraph: {
      title: `${app.name} | LaunchGrid`,
      description: app.description,
      url: `${SITE}/apps/${app.slug}`,
      siteName: 'LaunchGrid',
      type: 'website',
      images: appFeatureGraphic(app.slug)
        ? [{ url: `${SITE}${appFeatureGraphic(app.slug)}` }]
        : undefined,
    },
    twitter: { card: 'summary_large_image', title, description: app.description },
    alternates: { canonical: `${SITE}/apps/${app.slug}` },
  };
}

export default async function AppPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const app = getApp(slug);
  if (!app) notFound();

  const screenshots = appScreenshots(app.slug, app.name);
  const icon = appIcon(app.slug);
  const Icon = app.icon;

  const hasRealRating =
    typeof app.rating === 'number' && typeof app.ratingCount === 'number';

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: app.name,
      url: `${SITE}/apps/${app.slug}`,
      description: app.description,
      applicationCategory: 'MobileApplication',
      operatingSystem: app.platforms.includes('ios') ? 'Android, iOS' : 'Android',
      featureList: app.features,
      ...(icon ? { image: `${SITE}${icon}` } : {}),
      ...(app.playStoreUrl ? { downloadUrl: app.playStoreUrl } : {}),
      ...(screenshots.length > 0
        ? { screenshot: screenshots.map((shot) => `${SITE}${shot.src}`) }
        : {}),
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      ...(hasRealRating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: String(app.rating),
              ratingCount: String(app.ratingCount),
            },
          }
        : {}),
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Apps', item: `${SITE}/apps` },
        { '@type': 'ListItem', position: 2, name: app.name, item: `${SITE}/apps/${app.slug}` },
      ],
    },
    ...(app.faqs.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: app.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      {schema.map((block, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-20 sm:pt-28 pb-24">
        <div className="max-w-5xl mx-auto px-6">
          <nav aria-label="Breadcrumb" className="mb-8">
            <Link
              href="/apps"
              className="text-[11px] font-bold text-[var(--color-mark-subtle-text)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              ← All apps
            </Link>
          </nav>

          {/* Hero */}
          <header className="flex flex-col sm:flex-row sm:items-start gap-6 mb-10">
            <span className="w-20 h-20 rounded-[1.25rem] bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] flex items-center justify-center shrink-0 overflow-hidden">
              {icon ? (
                <Image src={icon} alt={`${app.name} icon`} width={80} height={80} className="w-full h-full object-cover" />
              ) : (
                <Icon className="w-8 h-8 text-[var(--color-mark-ink)]" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-2 block">
                {app.category}
              </span>
              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-3">
                {app.name}
              </h1>
              <p className="font-inter text-base font-bold text-[var(--color-mark-ink)] mb-3">
                {app.tagline}
              </p>
              <p className="font-inter text-sm text-[var(--color-mark-secondary)] leading-relaxed max-w-2xl">
                {app.description}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                {app.playStoreUrl ? (
                  <a
                    href={app.playStoreUrl}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-mark-ink)] px-5 py-2.5 text-[11px] font-bold text-white hover:bg-black transition-colors"
                  >
                    <Smartphone className="w-3.5 h-3.5" aria-hidden="true" /> Get it on Google Play
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-mark-default)] px-5 py-2.5 text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
                    Coming to Google Play
                  </span>
                )}
                <span className="font-inter text-[11px] font-bold text-[var(--color-mark-subtle-text)]">
                  {app.price}
                </span>
              </div>

              {(hasRealRating || app.installs) && (
                <dl className="mt-4 flex flex-wrap gap-6">
                  {hasRealRating && (
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)]">Rating</dt>
                      <dd className="font-playfair text-xl font-bold text-[var(--color-mark-ink)]">
                        {app.rating} <span className="text-xs font-normal text-[var(--color-mark-subtle-text)]">({app.ratingCount})</span>
                      </dd>
                    </div>
                  )}
                  {app.installs && (
                    <div>
                      <dt className="text-[10px] font-black uppercase tracking-wider text-[var(--color-mark-subtle-text)]">Installs</dt>
                      <dd className="font-playfair text-xl font-bold text-[var(--color-mark-ink)]">{app.installs}</dd>
                    </div>
                  )}
                </dl>
              )}
            </div>
          </header>

          {/* Screenshots — rendered only when the files exist */}
          {screenshots.length > 0 && (
            <section className="mb-14" aria-label="Screenshots">
              <ul className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {screenshots.map((shot) => (
                  <li key={shot.src} className="shrink-0 snap-start">
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={270}
                      height={540}
                      className="rounded-[1.25rem] border border-[var(--color-mark-default)] w-[220px] sm:w-[270px] h-auto"
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Features */}
          <section className="mb-14">
            <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-5">
              What it does
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {app.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--color-mark-green)]" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </section>

          {/* Privacy */}
          <section className="mb-14 bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[1.5rem] p-6">
            <h2 className="flex items-center gap-2 font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-2">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" /> Your data stays on your device
            </h2>
            <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-4">
              {app.name} stores what you enter in the app&rsquo;s private storage on your
              phone. There is no account to create, and no server of ours receives it.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href={app.privacyPolicyUrl} className="inline-flex items-center gap-1 font-inter text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                Privacy policy <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              {app.deleteAccountUrl && (
                <a href={app.deleteAccountUrl} className="inline-flex items-center gap-1 font-inter text-[11px] font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                  Delete your data <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </section>

          {/* FAQ */}
          {app.faqs.length > 0 && (
            <section className="mb-14">
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-5">
                Questions
              </h2>
              <dl className="space-y-5 max-w-2xl">
                {app.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="font-inter text-sm font-bold text-[var(--color-mark-ink)] mb-1.5">
                      {faq.question}
                    </dt>
                    <dd className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section className="pt-8 border-t border-[var(--color-mark-default)]">
            <p className="font-inter text-[11px] text-[var(--color-mark-subtle-text)]">
              <Link href="/apps" className="font-bold hover:text-[var(--color-mark-ink)] transition-colors">
                See every LaunchGrid app
              </Link>
              {' · '}
              <Link href="/tools" className="font-bold hover:text-[var(--color-mark-ink)] transition-colors">
                Free business tools
              </Link>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
