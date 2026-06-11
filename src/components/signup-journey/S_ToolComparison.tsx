'use client';

import { motion } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';

const tools = [
  {
    category: 'Website + eCommerce Store',
    icon: '🛍️',
    competitors: 'Shopify / Wix / WooCommerce',
    cost: '₹2,500/mo',
    lg: 'Custom-branded store, 5 templates',
  },
  {
    category: 'Payment Gateway',
    icon: '💳',
    competitors: 'Razorpay / PayU (+ 2% per txn)',
    cost: '₹1,000+/mo',
    lg: 'UPI + Razorpay BYOK — 0% platform fee',
  },
  {
    category: 'WhatsApp Chat Widget',
    icon: '💬',
    competitors: 'Wati / Interakt / AiSensy',
    cost: '₹2,499/mo',
    lg: 'WhatsApp button on every store page',
  },
  {
    category: 'Abandoned Cart Recovery',
    icon: '🔄',
    competitors: 'Klaviyo / Shopify Abandonment Apps',
    cost: '₹1,500/mo',
    lg: 'Built-in automated email recovery',
  },
  {
    category: 'GST Tax Invoicing',
    icon: '🧾',
    competitors: 'Vyapar / Zoho Invoice / Cleartax',
    cost: '₹999/mo',
    lg: 'Auto-generated CGST/SGST/IGST invoices',
  },
  {
    category: 'Order Email Notifications',
    icon: '📧',
    competitors: 'Mailchimp / SendGrid',
    cost: '₹1,080/mo',
    lg: 'Buyer confirmation + merchant alerts',
  },
  {
    category: 'Product Import Tool',
    icon: '📦',
    competitors: 'Manual research + copy-paste',
    cost: '₹2,000 (your time)',
    lg: 'Import from any URL in one click',
  },
  {
    category: 'SEO-Ready Storefront',
    icon: '🔍',
    competitors: 'Agency setup / freelancer',
    cost: '₹5,000/mo',
    lg: 'Structured pages, fast-loading store',
  },
];

// 2500+1000+2499+1500+999+1080+2000+5000 = 16578
const TOTAL_OTHERS = 16578;
const LG_PRICE = 1999;

export default function S_ToolComparison() {
  return (
    <section className="py-32 w-full bg-[var(--color-mark-ink)] text-white relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(var(--color-mark-inverse) 1px, transparent 1px), linear-gradient(90deg, var(--color-mark-inverse) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        <SectionReveal className="text-center mb-20">
          <ChapterLabel chapter="The Real Cost" label="Stop paying for 8 tools" />
          <EditorialHeadline
            text={"Everything you need.\nOne price.\nNo tool-hopping."}
            size="lg"
            className="[&_span]:!text-white"
          />
          <p className="font-inter text-white/60 mt-6 text-lg max-w-xl mx-auto">
            The average Indian D2C founder pays ₹15,000+ per month
            managing separate tools for every function. Here&apos;s the receipt.
          </p>
        </SectionReveal>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16">
          {tools.map((tool, idx) => (
            <motion.div
              key={tool.category}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '100px 0px -20px 0px' }}
              transition={{ delay: idx * 0.05, type: 'spring', stiffness: 120, damping: 20 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-start gap-4 group hover:bg-white/[0.08] transition-colors"
            >
              <span className="text-2xl shrink-0 mt-0.5">{tool.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-inter font-bold text-sm text-white mb-1">{tool.category}</p>
                <p className="font-inter text-xs text-white/40 mb-2 truncate">{tool.competitors}</p>
                <div className="flex items-center gap-3">
                  <span className="font-inter text-xs font-bold text-red-400 line-through opacity-70">{tool.cost}</span>
                  <span className="w-px h-3 bg-white/20" />
                  <span className="font-inter text-xs font-bold text-green-400">✓ {tool.lg}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Savings Callout */}
        <SectionReveal delay={0.3}>
          <div className="relative rounded-[2rem] overflow-hidden">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-[2rem]" />
            <div className="relative p-8 md:p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">

                {/* Left: "Without LaunchGrid" */}
                <div className="text-center md:text-left">
                  <p className="font-inter text-xs font-bold tracking-widest uppercase text-white/40 mb-3">Without LaunchGrid</p>
                  <div className="font-playfair text-5xl md:text-6xl font-bold text-red-400 line-through decoration-red-400/50 leading-none mb-2">
                    ₹{TOTAL_OTHERS.toLocaleString('en-IN')}
                  </div>
                  <p className="font-inter text-xs text-white/40">per month · 8 different logins</p>
                </div>

                {/* Center: Arrow + savings badge */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-green-500 text-white rounded-full px-6 py-3 font-inter font-black text-lg shadow-lg shadow-green-500/30">
                    Save ₹{(TOTAL_OTHERS - LG_PRICE).toLocaleString('en-IN')}/mo
                  </div>
                  <p className="font-inter text-xs text-white/40 text-center">That&apos;s ₹{((TOTAL_OTHERS - LG_PRICE) * 12).toLocaleString('en-IN')} saved per year</p>
                </div>

                {/* Right: "With LaunchGrid" */}
                <div className="text-center md:text-right">
                  <p className="font-inter text-xs font-bold tracking-widest uppercase text-white/40 mb-3">With LaunchGrid</p>
                  <div className="font-playfair text-5xl md:text-6xl font-bold text-green-400 leading-none mb-2">
                    ₹{LG_PRICE.toLocaleString('en-IN')}
                  </div>
                  <p className="font-inter text-xs text-white/40">per month · everything included</p>
                </div>

              </div>

              {/* Divider with label */}
              <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {['Website', 'Payments', 'WhatsApp', 'Invoicing', 'Email', 'SEO', 'Product Import', 'Cart Recovery'].map(tag => (
                  <span key={tag} className="font-inter text-xs text-white/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionReveal>

      </div>
    </section>
  );
}
