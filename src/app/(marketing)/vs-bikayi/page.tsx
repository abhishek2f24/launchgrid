import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LaunchGrid vs Bikayi — Better Bikayi Alternative for Indian Sellers',
  description: 'Looking for a Bikayi alternative? LaunchGrid gives Indian sellers a full storefront with UPI + COD checkout, automatic GST invoices, WhatsApp selling, and a free tier — live in 15 minutes.',
  alternates: { canonical: 'https://launchgrid.in/pricing' },
}

export default function VsBikayi() {
  redirect('/pricing#comparison')
}
