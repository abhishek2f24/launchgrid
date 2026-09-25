import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'ecommerce-pricing-calculator',
  name: 'Ecommerce Pricing Calculator',
  title: 'Ecommerce Pricing Calculator for Indian Sellers (Free)',
  description:
    'Find the selling price that covers product cost, packaging, shipping, payment gateway fees, ad spend and your target margin. Free, no signup, built for Indian D2C sellers.',
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
