import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/setup/'],
    },
    sitemap: 'https://launchgrid.in/sitemap.xml',
  };
}
