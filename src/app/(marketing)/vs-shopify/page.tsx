import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LaunchGrid vs Shopify — Best Shopify Alternative for India',
  description: 'Compare LaunchGrid vs Shopify for Indian sellers. No USD billing, native UPI payments, 0% transaction fees, and Indian compliance built-in.',
  alternates: { canonical: 'https://launchgrid.in/pricing' },
}

export default function VsShopify() {
  redirect('/pricing#comparison')
}
