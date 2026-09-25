import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  // Posts override title, description and canonical in blog/[slug]/page.tsx.
  // The root layout appends " | LaunchGrid".
  title: 'Ecommerce Guides for Indian Sellers — Blog',
  description: 'Practical guides for Indian online sellers: pricing and margins, GST, shipping, selling on WhatsApp, and category playbooks for sarees, mobile accessories and home decor.',
  openGraph: {
    title: 'LaunchGrid Blog — Grow Your Indian D2C Store',
    description: 'Growth playbooks and seller guides from the LaunchGrid team.',
    url: 'https://launchgrid.in/blog',
  },
  alternates: { canonical: 'https://launchgrid.in/blog' },
}

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
