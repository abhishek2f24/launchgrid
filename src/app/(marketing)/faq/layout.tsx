import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'FAQ — LaunchGrid',
  description: 'Answers to the most common questions about LaunchGrid — store setup, payments, trials, and subscriptions.',
  openGraph: {
    title: 'LaunchGrid FAQ',
    description: 'Everything you need to know before launching your store.',
    url: 'https://launchgrid.in/faq',
    images: [{ url: 'https://launchgrid.in/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://launchgrid.in/faq' },
}

export default function FAQLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
