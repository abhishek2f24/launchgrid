'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const faqs = [
  {
    q: 'How quickly can I launch my store?',
    a: 'Most merchants go live in under 15 minutes. You fill in your business details, pick a theme, import products from any URL (Meesho, Amazon, Ajio, Nykaa), and your store is live at yourname.launchgrid.in instantly.',
  },
  {
    q: 'Do I need a GSTIN to start selling?',
    a: 'No. You can sell without a GSTIN until you cross the ₹20L (services) or ₹40L (goods) turnover threshold. LaunchGrid monitors your revenue and alerts you when you\'re approaching these limits so you can register in time — no surprises.',
  },
  {
    q: 'How do customers pay me?',
    a: 'Your store supports native UPI (GPay, PhonePe, Paytm) out of the box. For cards, netbanking, and wallets you connect your own Razorpay account. All money goes directly to your bank — LaunchGrid takes 0% transaction fees.',
  },
  {
    q: 'What is dropshipping and can I do it here?',
    a: 'Dropshipping means selling products without holding inventory — your supplier ships directly to the customer. LaunchGrid lets you import products from Indian catalogs with one click, set your own margins, and start selling the same day with no upfront stock cost.',
  },
  {
    q: 'What happens after my 24-hour trial ends?',
    a: 'Your store stays live and your data is preserved. Checkout is paused until you activate a plan. Pick any paid plan to re-enable orders — and if you referred friends, each referral earns you 7 free days before you ever need to pay.',
  },
  {
    q: 'Is LaunchGrid better than Shopify or Dukaan for India?',
    a: 'For Indian sellers: yes. Shopify bills in USD, charges 2% transaction fees, and requires expensive plugins for UPI and GST. Dukaan is app-first with limited SEO. LaunchGrid is INR-billed, 0% fees, Google-indexable, with built-in GST compliance and WhatsApp abandoned cart recovery.',
  },
];

export default function S_FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="w-full px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-muted)] mb-3 block">
            FAQ
          </span>
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--color-mark-ink)] leading-tight">
            Questions every seller asks.
          </h2>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-[var(--color-mark-default)] rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(26,26,24,0.03)]"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center text-left px-6 py-5 font-inter font-semibold text-sm text-[var(--color-mark-ink)] hover:text-black transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <span className="ml-4 shrink-0 w-6 h-6 rounded-full bg-[var(--color-mark-subtle)] flex items-center justify-center font-mono text-base text-[var(--color-mark-secondary)]">
                  {open === i ? '−' : '+'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-5 font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[var(--color-mark-secondary)] mt-8">
          More questions?{' '}
          <Link href="/faq" className="underline underline-offset-2 hover:text-[var(--color-mark-ink)] transition-colors">
            See the full FAQ
          </Link>{' '}
          or{' '}
          <Link href="/support" className="underline underline-offset-2 hover:text-[var(--color-mark-ink)] transition-colors">
            contact support
          </Link>.
        </p>
      </div>
    </section>
  );
}
