'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Getting Started',
    items: [
      {
        question: 'How to start dropshipping in India with no investment?',
        answer: 'Starting a business shouldn\'t cost a fortune. With LaunchGrid, you don\'t need to buy inventory upfront or manage storage. You simply choose your niche, import high-quality products via our dropship catalog integrations, and launch your store in minutes. We handle the provisioning, hosting, and connection to delivery networks. Your only job is marketing to your audience.',
      },
      {
        question: 'What is the best ecommerce platform for small business in India?',
        answer: 'LaunchGrid is custom-tailored for the Indian market. Unlike international tools like Shopify which require expensive third-party plugins for UPI payments, local shipping, and WhatsApp alerts, or simple catalog builders like Dukaan that lack advanced automated GST handling, LaunchGrid provides an all-in-one suite (native UPI checkout, auto-calculated GST splits, Inngest-powered abandoned cart recovery, and Shiprocket tracking) natively in one plan.',
      },
    ],
  },
  {
    title: 'Payments',
    items: [
      {
        question: 'How do I collect payments on my store?',
        answer: 'Your store supports native UPI payments out of the box, allowing buyers to scan and pay instantly using GPay, PhonePe, or Paytm. For full card payments, netbanking, and wallets, you can wire your own custom Razorpay credentials from your dashboard settings. All money goes directly to your bank account with zero platform transaction fees.',
      },
      {
        question: 'What are the settlement cycles?',
        answer: 'Prepaid transactions collected via your custom Razorpay gateway are settled according to your standard Razorpay settlement cycle (typically T+2 business days). For direct UPI transfers, the payments settle instantly to your bank account.',
      },
    ],
  },
  {
    title: 'GST & Invoicing',
    items: [
      {
        question: 'How does GST work for an online store?',
        answer: 'GST compliance is built directly into LaunchGrid. The platform monitors your store\'s lifetime revenue and sends warnings as you approach threshold milestones (such as the ₹20 Lakh and ₹40 Lakh limits). For every transaction, the platform automatically splits CGST, SGST, and IGST based on the state of supply and issues tax-compliant invoices to your buyers.',
      },
    ],
  },
  {
    title: 'Shipping & Delivery',
    items: [
      {
        question: 'How are orders shipped to customers?',
        answer: 'LaunchGrid integrates natively with Shiprocket, giving you instant access to major logistics networks including Delhivery, BlueDart, Xpressbees, and Shadowfax. You can fulfill orders with a single tap from your merchant dashboard. Shipping rates, tracking numbers, and automated Cash on Delivery (COD) labels are generated automatically.',
      },
    ],
  },
  {
    title: 'Plans & Billing',
    items: [
      {
        question: 'What is abandoned cart recovery?',
        answer: 'Over 70% of shoppers add items to their carts and leave before finishing checkout. LaunchGrid automatically recovers these sales. When a customer enters their contact info but doesn\'t complete the payment, our background hooks schedule automatic recovery reminders to bring them back—reclaiming lost revenue without additional ad spend.',
      },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleItem = (catIndex: number, itemIndex: number) => {
    const key = `${catIndex}-${itemIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          
          {/* Breadcrumb & Header */}
          <div className="mb-16 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] mb-3 block">
              Frequently Asked Questions
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Answering your ecommerce questions.
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto">
              Everything you need to know about starting, running, and scaling an online store in India.
            </p>
          </div>

          {/* Categories & Accordions */}
          <div className="space-y-12">
            {faqData.map((category, catIdx) => (
              <div key={catIdx} className="bg-white rounded-[2rem] border border-[var(--color-mark-default)] p-8 shadow-[0_8px_32px_rgba(26,26,24,0.03)]">
                <h2 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-6 pb-2 border-b border-[var(--color-mark-default)]">
                  {category.title}
                </h2>
                
                <div className="divide-y divide-[var(--color-mark-default)]">
                  {category.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = openIndex === key;
                    
                    return (
                      <div key={itemIdx} className="py-4 first:pt-0 last:pb-0">
                        <button
                          onClick={() => toggleItem(catIdx, itemIdx)}
                          className="w-full flex justify-between items-center text-left py-2 font-inter font-semibold text-sm md:text-base text-[var(--color-mark-ink)] hover:text-black transition-colors focus:outline-none"
                        >
                          <span>{item.question}</span>
                          <span className="ml-4 shrink-0 text-xl font-mono text-[var(--color-mark-secondary)]">
                            {isOpen ? '−' : '+'}
                          </span>
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] leading-relaxed mt-2 pr-6">
                                {item.answer}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* CTA Footer */}
          <div className="mt-16 text-center bg-black text-white rounded-[2rem] p-10 md:p-12 shadow-xl">
            <h3 className="font-playfair text-2xl font-bold mb-4">Have a different question?</h3>
            <p className="font-inter text-xs md:text-sm text-white/70 max-w-md mx-auto mb-8">
              Our support team is live 24/7 to help you resolve technical, payment, or logistics questions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="bg-white text-black font-inter text-xs font-bold py-3 px-8 rounded-full hover:bg-white/95 transition-all"
              >
                Start Selling Free
              </Link>
              <Link
                href="/support"
                className="bg-white/10 text-white font-inter text-xs font-bold py-3 px-8 rounded-full hover:bg-white/20 transition-all border border-white/10"
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
