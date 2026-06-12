'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { Flame, Check, ArrowRight, X } from 'lucide-react';
import { platformEvent } from '@/lib/pixel';

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  originalPrice: number;
  features: string[];
  cta: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Get online today. Free, forever. No card needed.',
    monthlyPrice: 0,
    annualPrice: 0,
    originalPrice: 0,
    features: [
      'Live store in 15 minutes',
      'Up to 3 products',
      'COD + UPI payments',
      'GST-ready invoices',
      'Order alerts on your phone',
      '"Made with LaunchGrid" badge',
    ],
    cta: 'Start Free →',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Get Online',
    tagline: 'Your store. Your brand. Live in 15 minutes.',
    monthlyPrice: 1999,
    annualPrice: 1399,
    originalPrice: 9999,
    features: [
      'AI-generated store',
      'Dropship catalog (50 items)',
      'COD + UPI payments',
      'Custom domain included',
      'Mobile-responsive storefront',
      'Standard analytics',
      'Standard support',
    ],
    cta: 'Launch My Business →',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Get Customers',
    tagline: 'Traffic. Ads. Conversions. Everything you need for your first ₹1 Lakh.',
    monthlyPrice: 9999,
    annualPrice: 6999,
    originalPrice: 19999,
    features: [
      'Everything in Starter',
      'Meta Ads campaign templates',
      'Google Shopping setup',
      'WhatsApp abandoned cart recovery',
      'Custom Razorpay integration (BYOK)',
      'Advanced conversion analytics',
      'AI business assistant',
    ],
    cta: 'Start Growing →',
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale Revenue',
    tagline: 'For founders who have tasted success and want to scale.',
    monthlyPrice: 24999,
    annualPrice: 17999,
    originalPrice: 49999,
    features: [
      'Everything in Growth',
      'Automated GST compliance (CGST/SGST/IGST)',
      'Expanded catalog (500 items)',
      'Email abandoned cart sequences',
      'Priority 24/7 support',
      'Revenue scaling playbooks',
    ],
    cta: 'Scale Now →',
    popular: false,
  },
];

const competitorMatrix = [
  { feature: 'Pricing / billing currency', launchgrid: 'INR — no FX loss', dukaan: 'INR', shopify: 'USD (~₹2,500+/mo)' },
  { feature: 'Platform transaction fees', launchgrid: '0%', dukaan: '1.99%–2.99%', shopify: '0.5–2% per order' },
  { feature: 'Indian UPI checkout', launchgrid: 'Native, 1-click setup', dukaan: 'Setup required', shopify: 'Third-party app needed' },
  { feature: 'GST compliance & alerts', launchgrid: 'Built-in threshold tracking', dukaan: 'Basic billing only', shopify: 'App required (₹1,500/mo+)' },
  { feature: 'Abandoned cart recovery', launchgrid: 'WhatsApp + Email (free)', dukaan: 'Charged per message', shopify: 'Email only on Basic plan' },
  { feature: 'AI product import', launchgrid: 'Any URL (Meesho/Amazon/Ajio)', dukaan: 'Manual upload only', shopify: 'None built-in' },
  { feature: 'Store type / SEO', launchgrid: 'Full website + Schema.org', dukaan: 'App-first, limited crawl', shopify: 'Full website' },
  { feature: 'Custom domain (SSL)', launchgrid: 'Included', dukaan: 'Paid add-on', shopify: 'Included' },
  { feature: 'Dropship catalog', launchgrid: 'Indian SKUs, ready to sell', dukaan: 'Manual upload only', shopify: 'AliExpress-focused apps' },
  { feature: 'Referral program', launchgrid: 'Built-in (earn free days)', dukaan: 'None', shopify: 'None' },
  { feature: 'Store setup time', launchgrid: '15 minutes', dukaan: 'Plugin-heavy setup', shopify: '2–5 hours' },
];

export default function PricingPage() {
  // Default to annual: anchors the lower price and drives prepaid commitment
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Page Header */}
          <div className="text-center mb-16">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-3 block">
              Pricing Plans
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Transparent pricing. Zero hidden fees.
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto mb-8">
              Choose the plan that matches your store\'s journey. Upgrade, downgrade, or cancel anytime.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-4 bg-white border border-[var(--color-mark-default)] p-1.5 rounded-full shadow-sm">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 rounded-full font-inter text-xs font-bold transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-[var(--color-mark-ink)] text-white'
                    : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-5 py-2 rounded-full font-inter text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'annual'
                    ? 'bg-[var(--color-mark-ink)] text-white'
                    : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
                }`}
              >
                <span>Annual Billing</span>
                <span className="bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Premium Conversion-focused Announcement Banner */}
          <div className="relative mb-16 overflow-hidden rounded-[2.5rem] bg-white border border-slate-200/80 p-8 md:p-12 shadow-[0_32px_80px_rgba(26,26,24,0.04)] hover:shadow-[0_40px_96px_rgba(26,26,24,0.06)] transition-all duration-500 group">
            {/* Glow Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-90 group-hover:scale-x-[1.01] transition-transform duration-500" />
            
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-2xl text-left space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-700 border border-emerald-500/15">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Free Trial — Every Feature Included</span>
                </div>

                <div className="space-y-3">
                  <h2 className="font-playfair text-2xl md:text-3xl font-black text-zinc-900 leading-tight tracking-tight">
                    Try Every Feature Free For 7 Days
                  </h2>
                  <p className="font-inter text-xs md:text-sm text-zinc-500 font-medium">
                    Launch a real business. Not a demo. Explore the full power of LaunchGrid with zero restrictions and zero risk. See how it feels to have your own store live before you decide.
                  </p>
                </div>

                {/* Feature checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-6 pt-2">
                  {[
                    'Store Creation',
                    'Import Products',
                    'Setup Payments',
                    'Visitor Analytics',
                    'Order Processing',
                    'Abandoned Cart Automation'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-zinc-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-600 font-bold" />
                      </div>
                      <span className="font-inter text-xs font-semibold">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Button & CTA text */}
              <div className="shrink-0 flex flex-col justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2.5 bg-zinc-950 text-white font-inter font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-full hover:bg-zinc-800 transition-all duration-300 shadow-xl shadow-zinc-950/15 hover:shadow-zinc-950/25 active:scale-98 text-center group/btn"
                >
                  <span>Start My Free 7-Day Trial</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                </Link>
                <p className="font-inter text-[10px] text-zinc-400 text-center mt-3 font-semibold tracking-wide uppercase">
                  No credit card required • Active immediately
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Grids */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {plans.map((plan) => {
              const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              return (
                <div
                  key={plan.id}
                  className={`rounded-[2.5rem] border p-8 flex flex-col justify-between transition-all relative ${
                    plan.popular
                      ? 'bg-white border-green-500/30 shadow-[0_32px_80px_rgba(26,26,24,0.08)] scale-[1.03] z-10'
                      : 'bg-white border-[var(--color-mark-default)] shadow-[0_16px_48px_rgba(26,26,24,0.03)]'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--color-mark-green)] text-white font-mono text-[9px] font-bold tracking-widest uppercase py-1 px-4 rounded-full">
                      Most Popular
                    </span>
                  )}
                  
                  <div>
                    <div className="mb-6">
                      <span className="font-mono text-[10px] font-bold tracking-wider text-[var(--color-mark-subtle-text)] uppercase">
                        {plan.name}
                      </span>
                      <h3 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mt-2">
                        {plan.tagline}
                      </h3>
                    </div>

                    <div className="mb-8 border-b border-[var(--color-mark-default)] pb-6">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-inter font-bold text-4xl text-[var(--color-mark-ink)]">
                          {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                        </span>
                        {price > 0 && (
                          <span className="font-inter text-xs text-[var(--color-mark-secondary)]">/ month</span>
                        )}
                        {price > 0 && billingPeriod === 'annual' && plan.monthlyPrice > price && (
                          <span className="font-inter text-[11px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                            Save ₹{((plan.monthlyPrice - price) * 12).toLocaleString('en-IN')}/yr
                          </span>
                        )}
                      </div>
                      {price > 0 && billingPeriod === 'annual' && (
                        <span className="text-[10px] font-mono text-green-600 block mt-1.5">
                          Billed annually (₹{(price * 12).toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="text-green-500 font-mono text-xs mt-0.5">✓</span>
                          <span className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href={`/signup?plan=${plan.id}&billing=${billingPeriod}`}
                    onClick={() => platformEvent('select_plan', { plan: plan.id, billing: billingPeriod, value: price, currency: 'INR' })}
                    className={`w-full text-center font-inter text-xs font-bold py-4 px-6 rounded-full transition-all ${
                      plan.popular
                        ? 'bg-[var(--color-mark-ink)] text-white hover:bg-black shadow-lg shadow-black/5'
                        : 'bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] hover:bg-[var(--color-mark-default)] border border-[var(--color-mark-default)]'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Trust / risk-reversal strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 -mt-12 mb-24">
            {[
              '7-day free trial — no credit card',
              '0% platform transaction fees',
              'Cancel anytime, keep your data',
              'GST-compliant invoices included',
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 font-inter text-xs font-semibold text-[var(--color-mark-secondary)]">
                <Check className="w-3.5 h-3.5 text-green-600" />
                {item}
              </span>
            ))}
          </div>

          {/* Competitor Matrix Section */}
          <div id="comparison" className="mb-24 bg-white border border-[var(--color-mark-default)] rounded-[2.5rem] p-8 md:p-12 shadow-[0_16px_48px_rgba(26,26,24,0.03)] overflow-hidden">
            <div className="text-center mb-12">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-2 block">
                LaunchGrid vs Shopify vs Dukaan
              </span>
              <h2 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)]">
                Built for India. Better than the rest.
              </h2>
              <p className="font-inter text-xs text-[var(--color-mark-secondary)] mt-3 max-w-lg mx-auto">
                Shopify charges USD fees and needs expensive plugins for UPI. Dukaan is app-first with limited SEO. LaunchGrid does everything natively.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-[var(--color-mark-default)]">
                    <th className="py-4 pr-4 font-inter font-bold text-xs uppercase text-[var(--color-mark-subtle-text)] w-1/3">Feature</th>
                    <th className="py-4 px-3 font-inter font-bold text-xs uppercase text-green-700 bg-green-50/60 rounded-t-lg">LaunchGrid ✓</th>
                    <th className="py-4 px-3 font-inter font-bold text-xs uppercase text-[var(--color-mark-secondary)]">Dukaan</th>
                    <th className="py-4 px-3 font-inter font-bold text-xs uppercase text-[var(--color-mark-secondary)]">Shopify Basic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-mark-default)]">
                  {competitorMatrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-mark-subtle)]/50 transition-colors">
                      <td className="py-4 pr-4 font-inter font-semibold text-xs md:text-sm text-[var(--color-mark-ink)]">{row.feature}</td>
                      <td className="py-4 px-3 font-inter font-bold text-xs md:text-sm text-green-700 bg-green-50/40">{row.launchgrid}</td>
                      <td className="py-4 px-3 font-inter text-xs md:text-sm text-[var(--color-mark-secondary)]">{row.dukaan}</td>
                      <td className="py-4 px-3 font-inter text-xs md:text-sm text-[var(--color-mark-secondary)]">{row.shopify}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgraded Merchant Testimonial */}
          <div className="mb-24 bg-[var(--color-mark-subtle)] rounded-[2.5rem] border border-[var(--color-mark-default)] p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-20 h-20 rounded-full bg-white border border-[var(--color-mark-default)] flex items-center justify-center font-playfair italic text-2xl text-[var(--color-mark-secondary)] shrink-0 shadow-sm">
              A
            </div>
            <div>
              <blockquote className="font-playfair italic text-lg md:text-xl text-[var(--color-mark-ink)] leading-relaxed mb-4">
                "I upgraded to the Scale plan within 3 weeks when my orders hit the ₹1 Lakh threshold. The automated GST splitting and sitemap generator alone saved me days of manual paperwork."
              </blockquote>
              <cite className="font-inter not-italic font-bold text-xs md:text-sm text-[var(--color-mark-ink)]">
                — Arjun K., Bengaluru (Home Decor Merchant)
              </cite>
            </div>
          </div>

          {/* Plan FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] text-center mb-10">
              Pricing Frequently Asked Questions
            </h2>
            <div className="space-y-6 divide-y divide-[var(--color-mark-default)]">
              {[
                { q: 'Can I change my plan or cancel at any time?', a: 'Yes. You can upgrade, downgrade, or cancel your subscription directly from your settings dashboard. There are zero lock-in contracts.' },
                { q: 'Are there payment setup or activation fees?', a: 'No. Setting up UPI checkout is completely free. If you use your own Razorpay credentials, Razorpay may charge standard transaction fees, but LaunchGrid takes 0% commission.' },
                { q: 'What happens when my 7-day trial ends?', a: 'Once your trial finishes, storefront checkouts pause so customers never hit a broken store. Your data and products stay intact — pick any plan above to go live again instantly.' },
              ].map((faq, i) => (
                <div key={i} className="pt-6 first:pt-0">
                  <h3 className="font-inter font-bold text-sm text-[var(--color-mark-ink)] mb-2">{faq.q}</h3>
                  <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
