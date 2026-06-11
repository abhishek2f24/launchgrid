import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Blog — LaunchGrid',
  description: 'Growth playbooks, D2C strategies, and platform updates from the LaunchGrid team.',
  openGraph: {
    title: 'LaunchGrid Blog — Grow Your Indian D2C Store',
    description: 'Growth playbooks and seller guides from the LaunchGrid team.',
    url: 'https://launchgrid.in/blog',
    images: [{ url: 'https://launchgrid.in/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: 'https://launchgrid.in/blog' },
}

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
