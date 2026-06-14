'use client';

import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, TrendingUp, IndianRupee, Calculator, MessageSquare, Sparkles } from 'lucide-react';

interface ToolItem {
  name: string;
  slug: string;
  description: string;
  icon: any;
  useCases: string[];
  ctaText: string;
  badge?: string;
}

const toolsList: ToolItem[] = [
  {
    name: 'GST Calculator India',
    slug: 'gst-calculator',
    description: 'Quickly calculate CGST, SGST, IGST and the net amount for any product value across all Indian GST slabs.',
    icon: ShieldCheck,
    useCases: ['Calculate tax for billing', 'Find net amount excluding GST', 'Quick quote preparation'],
    ctaText: 'Calculate GST Now',
    badge: 'Compliance',
  },
  {
    name: 'Meta Ads ROAS Calculator',
    slug: 'roas-calculator',
    description: 'Calculate ROAS, CPA, and purchases based on ad spend, conversion value, and average order value.',
    icon: TrendingUp,
    useCases: ['Measure Meta Ads efficiency', 'Budget forecasting', 'CPA threshold validation'],
    ctaText: 'Calculate ROAS Now',
    badge: 'Marketing',
  },
  {
    name: 'Profit Margin Calculator',
    slug: 'profit-margin-calculator',
    description: 'Understand D2C profitability by calculating markup, margin percentage, gross profit, and ideal pricing.',
    icon: IndianRupee,
    useCases: ['Determine markup rate', 'Validate product pricing', 'Compare cost vs revenue'],
    ctaText: 'Calculate Profit Now',
    badge: 'Finance',
  },
  {
    name: 'Ecommerce Pricing Calculator',
    slug: 'ecommerce-pricing-calculator',
    description: 'Factor in shipping, packaging, gateway commissions, and CAC to discover your true bottom-line pricing.',
    icon: Calculator,
    useCases: ['Account for hidden costs', 'Set profitable selling prices', 'Break-even analysis'],
    ctaText: 'Calculate Price Now',
    badge: 'Pricing Strategy',
  },
  {
    name: 'WhatsApp Message Generator',
    slug: 'whatsapp-message-generator',
    description: 'Convert custom messages into formatted WhatsApp click-to-chat links and copy-ready QR codes.',
    icon: MessageSquare,
    useCases: ['Generate Instagram story links', 'Pre-fill support chats', 'Configure marketing campaigns'],
    ctaText: 'Generate Message Now',
    badge: 'Growth Tool',
  },
  {
    name: 'Store Name Generator',
    slug: 'store-name-generator',
    description: 'Get instant brand name suggestions matching Indian consumer psychology, and search domain availability.',
    icon: Sparkles,
    useCases: ['Brainstorm brand names', 'Check domain availability', 'Niche-focused suggestions'],
    ctaText: 'Generate Name Now',
    badge: 'Brand Identity',
  },
];

export default function ToolsHubPage() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16 border-b border-[var(--color-mark-default)] pb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-3 block">
              Free D2C & Retail Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-6xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Free D2C Business Tools
            </h1>
            <p className="font-inter text-sm md:text-base text-[var(--color-mark-secondary)] max-w-2xl mx-auto leading-relaxed">
              Simple, powerful calculators and generators built specifically for Indian D2C brands, dropshippers, and Meta advertisers to optimize margins and conversion rates.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {toolsList.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05, duration: 0.4 }}
                  className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-8 shadow-[0_8px_30px_rgba(26,26,24,0.03)] hover:shadow-[0_16px_48px_rgba(26,26,24,0.07)] hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--color-mark-subtle-text)] bg-[var(--color-mark-subtle)] px-3 py-1 rounded-full">
                        {tool.badge}
                      </span>
                    </div>

                    <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">
                      {tool.name}
                    </h2>

                    <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-6">
                      {tool.description}
                    </p>

                    <div className="space-y-2 mb-8">
                      <p className="font-inter text-[11px] font-bold text-[var(--color-mark-ink)] uppercase tracking-wider">
                        Use cases:
                      </p>
                      <ul className="space-y-1.5">
                        {tool.useCases.map((uc, index) => (
                          <li key={index} className="flex items-center gap-2 font-inter text-xs text-[var(--color-mark-secondary)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-mark-green)] shrink-0" />
                            {uc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Link
                    href={`/tools/${tool.slug}`}
                    className="inline-flex justify-center items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3 px-6 rounded-full group-hover:bg-black transition-colors w-full shadow-sm"
                  >
                    {tool.ctaText} →
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Trust/Promo Section */}
          <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2.5rem] p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h3 className="font-playfair text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] mb-4">
              Need more than just calculators?
            </h3>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed">
              LaunchGrid handles all the math, invoicing, and tax splits automatically. Set up your Indian D2C storefront in 15 minutes with native UPI payments and 0% transaction fees.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/onboarding"
                className="bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black active:scale-[0.98] transition-all shadow-md"
              >
                Launch Store Free
              </Link>
              <Link
                href="/pricing"
                className="font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] py-3 px-6"
              >
                View Plans & Pricing
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
