'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calculator, Percent, ShieldCheck, HelpCircle } from 'lucide-react';

const previewTools = [
  {
    name: 'GST Calculator India',
    description: 'Calculate SGST, CGST, and IGST for any slab (5%, 12%, 18%, 28%) with instant Add/Remove toggle.',
    href: '/tools/gst-calculator',
    icon: ShieldCheck,
    badge: 'Popular',
  },
  {
    name: 'Meta Ads ROAS Calculator',
    description: 'Evaluate your ad spend efficiency. Calculate ROAS, cost-per-acquisition (CPA), and conversion metrics instantly.',
    href: '/tools/roas-calculator',
    icon: Calculator,
    badge: 'Ads Spec',
  },
  {
    name: 'Profit Margin Calculator',
    description: 'Calculate gross profit, net margin, markup percentage, and target selling price for your ecommerce products.',
    href: '/tools/profit-margin-calculator',
    icon: Percent,
    badge: 'Essential',
  },
  {
    name: 'Store Name Generator',
    description: 'Generate catchy, premium, brandable store names tailored to Indian audiences and check domain availability.',
    href: '/tools/store-name-generator',
    icon: HelpCircle,
    badge: 'AI Powered',
  },
];

export default function S_ToolsPreview() {
  return (
    <section className="w-full px-6 py-24 bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)] relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-4 inline-block font-semibold">
            Free Utilities
          </span>
          <h2 className="font-playfair text-3xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
            Free Business Tools
          </h2>
          <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto">
            Interactive calculators and generators built specifically for Indian D2C brands, dropshippers, and Meta advertisers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {previewTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-8 shadow-[0_4px_20px_rgba(26,26,24,0.04)] flex flex-col hover:shadow-[0_12px_36px_rgba(26,26,24,0.08)] hover:-translate-y-1 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)] flex items-center justify-center">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--color-mark-subtle-text)] bg-[var(--color-mark-subtle)] px-2.5 py-1 rounded-full">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3 group-hover:text-black">
                  {tool.name}
                </h3>
                
                <p className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-6 flex-1">
                  {tool.description}
                </p>

                <Link
                  href={tool.href}
                  className="font-inter text-xs font-bold text-[var(--color-mark-ink)] group-hover:underline flex items-center gap-1 mt-auto"
                >
                  Use Tool →
                </Link>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            href="/tools"
            className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3 px-8 rounded-full hover:bg-black active:scale-[0.98] transition-all shadow-md"
          >
            Browse All Tools
          </Link>
        </div>
      </div>
    </section>
  );
}
