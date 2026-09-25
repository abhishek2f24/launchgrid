import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'roas-calculator',
  name: 'Meta Ads ROAS Calculator',
  title: 'ROAS Calculator for Meta Ads — Break-even ROAS, CPA & Profit',
  description:
    'Free ROAS calculator: work out return on ad spend, cost per purchase and break-even ROAS for Meta, Google and Instagram ads, in rupees. No signup needed.',
};

export const metadata = toolMetadata(TOOL);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolJsonLd tool={TOOL} />
      {children}
    </>
  );
}
