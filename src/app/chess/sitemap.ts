import { MetadataRoute } from 'next';

/**
 * The chess.launchgrid.in sitemap. The proxy rewrites that host's
 * /sitemap.xml onto this one, so the file Google fetches at
 * https://chess.launchgrid.in/sitemap.xml is this list — and every URL in it
 * is the canonical subdomain URL, matching the `alternates.canonical` on each
 * page. The main launchgrid.in sitemap deliberately does not list /chess/*.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chess.launchgrid.in';
  const updated = '2026-11-02';
  return [
    { url: baseUrl, lastModified: updated, changeFrequency: 'monthly', priority: 1.0 },
    { url: `${baseUrl}/winners`, lastModified: updated, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/winners/guide`, lastModified: updated, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/about`, lastModified: updated, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
