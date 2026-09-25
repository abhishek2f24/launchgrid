import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';
import { PROFIT_MARGIN_FAQS } from './content';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'profit-margin-calculator',
  name: 'Profit Margin Calculator',
  title: 'Free Profit Margin Calculator for Products (India)',
  description:
    'Calculate gross margin, net margin and markup for any product in rupees. Includes shipping, COD returns and GST, plus worked examples for Indian online sellers. Free, no signup.',
  keywords: [
    'profit margin calculator',
    'product profit margin calculator',
    'margin calculator india',
    'markup vs margin',
    'selling price calculator',
  ],
  faqs: PROFIT_MARGIN_FAQS,
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
