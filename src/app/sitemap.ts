import { MetadataRoute } from 'next';

// Keep these in sync with src/app/(marketing)/blog and src/app/(marketing)/features/[slug]
const BLOG_SLUGS = [
  'start-dropshipping-india',
  'gst-compliance-ecommerce',
  'what-is-abandoned-cart-recovery',
];

const FEATURE_SLUGS = [
  'gst-invoicing',
  'abandoned-cart',
  'one-click-checkout',
  'whatsapp-marketing',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://launchgrid.in';
  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',               priority: 1.0, freq: 'weekly'  },
    { path: '/pricing',       priority: 0.9, freq: 'monthly' },
    { path: '/blog',          priority: 0.8, freq: 'weekly'  },
    { path: '/discover',      priority: 0.7, freq: 'daily'   },
    { path: '/faq',           priority: 0.7, freq: 'monthly' },
    { path: '/signup',        priority: 0.9, freq: 'monthly' },
    { path: '/join',          priority: 0.8, freq: 'monthly' },
    { path: '/login',         priority: 0.5, freq: 'yearly'  },
    { path: '/support',       priority: 0.4, freq: 'yearly'  },
    { path: '/vs-shopify',    priority: 0.8, freq: 'monthly' },
    { path: '/vs-dukaan',     priority: 0.8, freq: 'monthly' },
    { path: '/legal/terms',   priority: 0.3, freq: 'yearly'  },
    { path: '/legal/privacy', priority: 0.3, freq: 'yearly'  },
    { path: '/legal/refund',  priority: 0.3, freq: 'yearly'  },
    { path: '/legal/contact', priority: 0.4, freq: 'yearly'  },
    ...BLOG_SLUGS.map(slug => ({ path: `/blog/${slug}`, priority: 0.7, freq: 'monthly' as const })),
    ...FEATURE_SLUGS.map(slug => ({ path: `/features/${slug}`, priority: 0.8, freq: 'monthly' as const })),
  ];

  return routes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));
}
