import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'store-name-generator',
  name: 'Store Name Generator',
  title: 'Store Name Generator — Brandable Names for Indian Online Shops',
  description:
    'Generate brandable names for your online store or D2C brand in India, with domain ideas you can check instantly. Free, no signup.',
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
