import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ToolShell } from '@/components/tools/ToolShell';
import { CalculatorWorkspace } from '@/components/calculators/CalculatorWorkspace';
import { DocumentToolPage } from '@/components/documents/DocumentToolPage';
import { GeneratorWorkspace } from '@/components/generators/GeneratorWorkspace';
import { CALCULATORS, getCalculator } from '@/lib/calculators/registry';
import { GENERATORS, getGenerator } from '@/lib/generators/registry';
import { DOCUMENT_KINDS, DOCUMENT_KIND_LIST, documentSlug, kindFromSlug } from '@/lib/documents/kinds';

/**
 * One route for every generated tool — calculators and documents alike.
 *
 * WHY THIS IS THE CHEAP DESIGN
 *   `generateStaticParams` prerenders all fifteen at build time and
 *   `dynamicParams = false` refuses anything else, so there is no on-demand
 *   rendering path at all. Each calculator is a static HTML file plus a shared
 *   JS chunk that caches across every one of them. Serving them costs a file
 *   read; the arithmetic runs on the visitor's device. Traffic can grow without
 *   the hosting bill following it, which is the constraint we are building to
 *   until the first sale lands.
 *
 *   The bespoke calculator pages that already exist (gst-calculator,
 *   roas-calculator, profit-margin-calculator, and the rest) are static sibling
 *   segments and take precedence over this dynamic one, so they are unaffected.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...CALCULATORS.map((calc) => ({ slug: calc.slug })),
    ...DOCUMENT_KIND_LIST.map((kind) => ({ slug: documentSlug(kind) })),
    ...GENERATORS.map((generator) => ({ slug: generator.slug })),
  ];
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;

  const kind = kindFromSlug(slug);
  if (kind) {
    const config = DOCUMENT_KINDS[kind];
    return {
      title: config.pageTitle,
      description: config.pageDescription,
      keywords: config.keywords,
      openGraph: {
        title: `${config.pageTitle} | LaunchGrid`,
        description: config.pageDescription,
        url: `https://launchgrid.in/tools/${slug}`,
        siteName: 'LaunchGrid',
        type: 'website',
      },
      alternates: { canonical: `https://launchgrid.in/tools/${slug}` },
    };
  }

  const generator = getGenerator(slug);
  if (generator) {
    return {
      title: generator.title,
      description: generator.description,
      keywords: generator.keywords,
      openGraph: {
        title: `${generator.title} | LaunchGrid`,
        description: generator.description,
        url: `https://launchgrid.in/tools/${slug}`,
        siteName: 'LaunchGrid',
        type: 'website',
      },
      alternates: { canonical: `https://launchgrid.in/tools/${slug}` },
    };
  }

  const def = getCalculator(slug);
  if (!def) return {};

  return {
    title: def.title,
    description: def.description,
    keywords: def.keywords,
    openGraph: {
      title: `${def.title} | LaunchGrid`,
      description: def.description,
      url: `https://launchgrid.in/tools/${def.slug}`,
      siteName: 'LaunchGrid',
      type: 'website',
    },
    alternates: {
      canonical: `https://launchgrid.in/tools/${def.slug}`,
    },
  };
}

export default async function GeneratedToolPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  // Documents bring their own page shell — three shapes, three renderers.
  const kind = kindFromSlug(slug);
  if (kind) return <DocumentToolPage kind={kind} />;

  const generator = getGenerator(slug);
  if (generator) {
    return (
      <ToolShell
        badge={generator.badge}
        title={generator.title}
        description={generator.description}
        useCases={generator.useCases}
        schemaCategory="BusinessApplication"
        slug={slug}
      >
        <GeneratorWorkspace slug={slug} />
      </ToolShell>
    );
  }

  const def = getCalculator(slug);
  if (!def) notFound();

  return (
    <ToolShell
      slug={def.slug}
      badge={def.badge}
      title={def.title}
      description={def.description}
      useCases={def.useCases}
      schemaCategory="FinanceApplication"
      privacyLine="Free · no account · calculates in your browser"
    >
      <CalculatorWorkspace slug={def.slug} />
    </ToolShell>
  );
}
