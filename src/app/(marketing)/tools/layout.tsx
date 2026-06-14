import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free D2C & Ecommerce Business Tools for Indian Brands | LaunchGrid',
  description: 'Boost your D2C growth with free business calculators and utility generators: GST, Meta Ads ROAS, Profit Margin, Ecommerce Pricing, WhatsApp link maker, and Store Name Generator.',
  keywords: ['gst calculator india', 'roas calculator', 'profit margin calculator', 'ecommerce pricing calculator', 'whatsapp message generator', 'store name generator', 'd2c tools', 'free business calculators'],
  openGraph: {
    title: 'Free Business Tools for Indian D2C & Ecommerce Brands | LaunchGrid',
    description: 'Free business tools built specifically for Indian D2C, dropshipping, and Meta Ads. Optimize your sales margins and pricing today.',
    url: 'https://launchgrid.in/tools',
    siteName: 'LaunchGrid',
    type: 'website',
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
