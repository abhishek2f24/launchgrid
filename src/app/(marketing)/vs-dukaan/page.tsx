import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LaunchGrid vs Dukaan — Better Dukaan Alternative for D2C Sellers',
  description: 'Compare LaunchGrid vs Dukaan. Full website (not app-only), AI product import, automated abandoned cart recovery, and GST compliance built in.',
  alternates: { canonical: 'https://launchgrid.in/pricing' },
}

export default function VsDukaan() {
  redirect('/pricing#comparison')
}
