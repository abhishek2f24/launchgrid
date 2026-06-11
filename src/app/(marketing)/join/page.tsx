import type { Metadata } from 'next'
import Link from 'next/link'
import { JourneyNav } from '@/components/signup-journey/JourneyNav'
import { Footer } from '@/components/signup-journey/Footer'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'
import { Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Start Selling Online — LaunchGrid',
  description: 'You just bought from a LaunchGrid store. Want to sell too? Launch your own online store in 15 minutes with native UPI payments, GST compliance, and free delivery tracking.',
  alternates: { canonical: 'https://launchgrid.in/join' },
}

const benefits = [
  'Your own store live in 15 minutes',
  'Accept payments via UPI, cards, or COD',
  'Custom domain included on all plans',
  'GST compliance built in — no CA needed',
  'Indian dropship catalog — sell without holding stock',
  'Try free for 7 days — no card required',
]

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-[var(--color-mark-base)] font-inter">
      <JourneyNav />
      <GrainOverlay />

      <main className="pt-32 pb-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-mark-secondary)] font-bold mb-4">
            You just shopped at a LaunchGrid store
          </p>
          <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-6">
            You could be selling<br className="hidden md:block" /> the same way.
          </h1>
          <p className="text-[var(--color-mark-secondary)] text-base leading-relaxed max-w-xl mx-auto">
            Every store you see with "Powered by LaunchGrid" was built by someone just like you — starting from an idea, a phone, and a few products. It takes 15 minutes.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16 max-w-2xl mx-auto">
          {benefits.map((b) => (
            <div key={b} className="flex items-start gap-3 p-4 bg-white border border-[var(--color-mark-default)] rounded-2xl shadow-sm">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
              </div>
              <span className="text-sm font-semibold text-[var(--color-mark-ink)]">{b}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-[var(--color-mark-ink)] text-white text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
          >
            Start My Store Free →
          </Link>
          <p className="text-[11px] text-[var(--color-mark-secondary)] font-medium uppercase tracking-wider">
            7-day free trial · No credit card · Cancel anytime
          </p>
        </div>

        {/* Pricing preview */}
        <div className="mt-20 p-8 bg-white border border-[var(--color-mark-default)] rounded-3xl shadow-sm max-w-2xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-mark-secondary)] font-bold mb-3">Simple Pricing</p>
          <p className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">
            Starts at ₹999<span className="text-lg font-medium">/mo</span>
          </p>
          <p className="text-sm text-[var(--color-mark-secondary)] mb-6">
            Less than ₹33 per day. The cost of one chai, paid by any single sale.
          </p>
          <Link href="/pricing" className="text-sm font-bold text-[var(--color-mark-ink)] underline underline-offset-2 hover:no-underline">
            See all plans →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
