import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'gst-calculator',
  name: 'GST Calculator India',
  title: 'GST Calculator India — Add or Remove GST, CGST/SGST/IGST Split',
  description:
    'Free GST calculator for India: add or remove GST at any slab and see the CGST + SGST or IGST split instantly. Works in your browser, no signup needed.',
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
