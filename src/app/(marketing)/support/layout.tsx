import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Support — LaunchGrid',
  description: 'Get help with your LaunchGrid store. Our team responds within 2–4 hours.',
  openGraph: {
    title: 'LaunchGrid Support',
    description: 'Get help with your store setup, payments, and subscriptions.',
    url: 'https://launchgrid.in/support',
    images: [{ url: 'https://launchgrid.in/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://launchgrid.in/support' },
  robots: { index: false }, // don't index support page
}

export default function SupportLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
