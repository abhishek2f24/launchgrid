import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://launchgrid.in';
  const routes: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '',               priority: 1.0, freq: 'weekly'  },
    { path: '/pricing',       priority: 0.9, freq: 'monthly' },
    { path: '/blog',          priority: 0.8, freq: 'weekly'  },
    { path: '/faq',           priority: 0.7, freq: 'monthly' },
    { path: '/signup',        priority: 0.9, freq: 'monthly' },
    { path: '/join',          priority: 0.8, freq: 'monthly' },
    { path: '/login',         priority: 0.5, freq: 'yearly'  },
    { path: '/support',       priority: 0.4, freq: 'yearly'  },
    { path: '/vs-shopify',   priority: 0.8, freq: 'monthly' },
    { path: '/vs-dukaan',    priority: 0.8, freq: 'monthly' },
    { path: '/legal/terms',   priority: 0.3, freq: 'yearly'  },
    { path: '/legal/privacy', priority: 0.3, freq: 'yearly'  },
    { path: '/legal/refund',  priority: 0.3, freq: 'yearly'  },
    { path: '/legal/contact', priority: 0.4, freq: 'yearly'  },
  ];

  return routes.map(({ path, priority, freq }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: freq,
    priority,
  }));
}
