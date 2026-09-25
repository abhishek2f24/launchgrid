import type { Metadata } from 'next';
import { liveTools } from '@/data/tools';

// Keywords come from the catalogue so a new tool brings its own search terms
// with it instead of needing a second edit here.
const toolKeywords = Array.from(
  new Set(liveTools().flatMap((tool) => tool.keywords))
);

export const metadata: Metadata = {
  // The root layout appends '| LaunchGrid' via its title template.
  title: 'Free Business Tools for Indian Sellers',
  description:
    'Free calculators and generators for Indian sellers: GST, Meta Ads ROAS, profit margin, ecommerce pricing, WhatsApp links and QR codes, store names, and product research.',
  keywords: toolKeywords,
  openGraph: {
    title: 'Free Business Tools for Indian Sellers | LaunchGrid',
    description:
      'Free business tools built for Indian D2C, retail and WhatsApp sellers. Most need no account.',
    url: 'https://launchgrid.in/tools',
    siteName: 'LaunchGrid',
    type: 'website',
  },
  alternates: {
    canonical: 'https://launchgrid.in/tools',
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
