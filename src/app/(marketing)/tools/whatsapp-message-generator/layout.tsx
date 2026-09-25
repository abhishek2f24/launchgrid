import { toolMetadata, ToolJsonLd, type ToolSeo } from '@/lib/seo/tool-page';

// The page is a client component; its metadata lives here (see tool-page.tsx).
const TOOL: ToolSeo = {
  slug: 'whatsapp-message-generator',
  name: 'WhatsApp Link Generator',
  title: 'WhatsApp Link Generator — Free Click-to-Chat Link with Message',
  description:
    'Create a free wa.me click-to-chat link with a pre-filled message for your Instagram bio, website button or QR code. No signup, works instantly.',
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
