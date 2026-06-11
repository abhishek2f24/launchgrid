import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Pricing — LaunchGrid',
  description: 'Transparent plans for every stage of your D2C journey. Start with a free 24-hour trial — no credit card required.',
  openGraph: {
    title: 'LaunchGrid Pricing — Zero hidden fees.',
    description: 'Starter, Growth, and Scale plans. UPI payments with 0% transaction fees.',
    url: 'https://launchgrid.in/pricing',
    images: [{ url: 'https://launchgrid.in/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://launchgrid.in/pricing' },
}

export default function PricingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
