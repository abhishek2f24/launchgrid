import { MetadataRoute } from 'next';
import { ALL_SEO_PAGES } from '@/lib/seo-pages';
import { liveTools } from '@/data/tools';
import { APPS } from '@/data/apps';
import { blogPosts, postModifiedISO } from '@/lib/blog-posts';
import { getGuide } from '@/lib/sell-online-guides';

// The sitemap lists ONLY indexable, canonical URLs. Every URL here that
// redirects, is noindexed or canonicalises elsewhere shows up in Search Console
// as an exclusion and wastes crawl budget. Deliberately absent:
//   /vs-shopify, /vs-dukaan, /vs-bikayi — redirect to /pricing#comparison
//   /support                            — noindex
//   /login, /signup                     — auth screens, nothing to rank
//   /sell-online/<slug> without a guide — noindex (see sell-online-guides.ts)

// Bump when static marketing pages change substantively. A lastModified of
// "now" on every URL tells Google nothing and teaches it to ignore the field.
const STATIC_UPDATED = '2026-09-25';

// Keep in sync with src/app/(marketing)/features/[slug]

const FEATURE_SLUGS = [
  'gst-invoicing',
  'abandoned-cart',
  'one-click-checkout',
  'whatsapp-marketing',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://launchgrid.in';
  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency']; modified?: string }[] = [
    { path: '',               priority: 1.0, freq: 'weekly'  },
    { path: '/pricing',       priority: 0.9, freq: 'monthly' },
    { path: '/tools',         priority: 0.9, freq: 'weekly'  },
    { path: '/blog',          priority: 0.8, freq: 'weekly'  },
    { path: '/discover',      priority: 0.7, freq: 'daily'   },
    { path: '/faq',           priority: 0.7, freq: 'monthly' },
    { path: '/join',          priority: 0.8, freq: 'monthly' },
    { path: '/legal/terms',   priority: 0.3, freq: 'yearly'  },
    { path: '/legal/privacy', priority: 0.3, freq: 'yearly'  },
    { path: '/legal/refund',  priority: 0.3, freq: 'yearly'  },
    { path: '/legal/contact', priority: 0.4, freq: 'yearly'  },
    ...Object.entries(blogPosts).map(([slug, post]) => ({
      path: `/blog/${slug}`, priority: 0.7, freq: 'monthly' as const, modified: postModifiedISO(post),
    })),
    ...FEATURE_SLUGS.map(slug => ({ path: `/features/${slug}`, priority: 0.8, freq: 'monthly' as const })),
    { path: '/sell-online', priority: 0.9, freq: 'monthly' as const },
    { path: '/free-setup', priority: 0.8, freq: 'monthly' as const },
    { path: '/shopify-payout-reconciliation', priority: 1.0, freq: 'weekly' as const },
    { path: '/apps', priority: 0.9, freq: 'weekly' as const },
    // Every app page, straight from the catalogue.
    ...APPS.map(a => ({ path: `/apps/${a.slug}`, priority: a.priority, freq: 'monthly' as const })),
    ...ALL_SEO_PAGES.flatMap(p => {
      const guide = getGuide(p.slug);
      return guide
        ? [{ path: `/sell-online/${p.slug}`, priority: 0.9, freq: 'monthly' as const, modified: guide.updated }]
        : [];
    }),
    // Every live tool, straight from the catalogue — the homepage grid and the
    // sitemap can no longer disagree about which tools exist.
    ...liveTools().map(t => ({ path: t.href, priority: t.priority, freq: 'monthly' as const })),
  ];

  return routes.map(({ path, priority, freq, modified }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(modified ?? STATIC_UPDATED),
    changeFrequency: freq,
    priority,
  }));
}
