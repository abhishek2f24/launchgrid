import type { Metadata } from 'next';

// Metadata + structured data for the hand-built tool pages under
// (marketing)/tools/<slug>. Those pages are client components and cannot export
// metadata themselves, so each gets a tiny layout.tsx that calls these.
//
// Without that layout a tool inherits tools/layout.tsx — the hub's title and a
// canonical pointing at /tools — and Google folds the tool into the hub as a
// duplicate. Every tool must declare its own canonical.

const SITE = 'https://launchgrid.in';

export interface ToolSeo {
  slug: string;
  /** Full <title> text. Nested under tools/layout.tsx, so no brand suffix is added. */
  title: string;
  description: string;
  /** Short name used in breadcrumbs and the WebApplication entity. */
  name: string;
  keywords?: string[];
  faqs?: { q: string; a: string }[];
}

export function toolMetadata(tool: ToolSeo): Metadata {
  const url = `${SITE}/tools/${tool.slug}`;
  return {
    title: tool.title,
    description: tool.description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: `${tool.title} | LaunchGrid`,
      description: tool.description,
      url,
      siteName: 'LaunchGrid',
      type: 'website',
      locale: 'en_IN',
    },
  };
}

export function ToolJsonLd({ tool }: { tool: ToolSeo }) {
  const url = `${SITE}/tools/${tool.slug}`;
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebApplication',
      name: tool.name,
      url,
      description: tool.description,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (runs in the browser)',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
      publisher: { '@id': `${SITE}/#organization` },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'Free Tools', item: `${SITE}/tools` },
        { '@type': 'ListItem', position: 3, name: tool.name, item: url },
      ],
    },
  ];
  if (tool.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: tool.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  );
}
