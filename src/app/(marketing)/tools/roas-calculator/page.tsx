'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';

export default function RoasCalculatorPage() {
  const [spend, setSpend] = useState<string>('50000');
  const [revenue, setRevenue] = useState<string>('175000');
  const [aov, setAov] = useState<string>('1200');

  const parsedSpend = parseFloat(spend) || 0;
  const parsedRevenue = parseFloat(revenue) || 0;
  const parsedAov = parseFloat(aov) || 0;

  const roas = parsedSpend > 0 ? parsedRevenue / parsedSpend : 0;
  const purchases = parsedAov > 0 ? Math.round(parsedRevenue / parsedAov) : 0;
  const cpa = purchases > 0 ? parsedSpend / purchases : 0;

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Marketing Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Meta Ads ROAS Calculator
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Calculate Return on Ad Spend (ROAS), Cost Per Acquisition (CPA), and purchase counts to evaluate your Meta, Google, and TikTok marketing campaigns.
            </p>
          </div>

          {/* Calculator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Ad Spend (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={spend}
                      onChange={(e) => setSpend(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Revenue Generated (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={revenue}
                      onChange={(e) => setRevenue(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Average Order Value / AOV (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={aov}
                      onChange={(e) => setAov(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3">
                    Performance Summary
                  </p>

                  <div className="text-center py-6">
                    <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)]">Calculated ROAS</span>
                    <h2 className="font-playfair text-5xl font-bold text-[var(--color-mark-green)] mt-2">
                      {roas.toFixed(2)}x
                    </h2>
                  </div>

                  <div className="border-t border-dashed border-[var(--color-mark-default)] my-2" />

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Estimated Purchases:</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">{purchases} orders</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Cost Per Acquisition (CPA):</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{cpa.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-mark-default)] text-center">
                  <span className="font-inter text-[10px] text-[var(--color-mark-subtle-text)]">
                    *Based on AOV of ₹{parsedAov}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">What is ROAS (Return on Ad Spend)?</h2>
              <p className="mb-4">
                Return on Ad Spend (ROAS) is a key marketing metric that measures the amount of revenue your business earns for every Rupee spent on advertising. For online stores and D2C brands, tracking ROAS is vital to assess whether campaign marketing channels (such as Meta Ads, Google Shopping, or influencer campaigns) are profitable.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">The ROAS Formula</h2>
              <p className="mb-2">The math is simple, but the impact is huge:</p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4">
                ROAS = Gross Revenue / Ad Spend
              </pre>
              <p className="mb-2">For instance, if you spend ₹10,000 on Facebook Ads and generate ₹40,000 in revenue, your calculation is:</p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px]">
                ROAS = 40,000 / 10,000 = 4.00 (or 4.0x)
              </pre>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">ROAS vs ROI: What is the Difference?</h2>
              <p>
                While both calculate returns, they measure different segments of D2C performance:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>ROAS</strong>: Specifically measures the revenue generated against your ad costs. It ignores other business overheads like cost of goods, packing material, logistics fees, or staff salaries.</li>
                <li><strong>ROI (Return on Investment)</strong>: Measures net profit against all investments (product COGS + shipping + gateway commission + ad costs). A campaign might have a high ROAS (e.g., 3.0x) but yield a negative ROI if product costs or logistics fees are too high.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">What is a Good ROAS for D2C Brands in India?</h2>
              <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-6 space-y-4 shadow-sm">
                <p>Profit thresholds vary by product margins, but general guidelines are:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Below 2.0x</strong>: Usually unprofitable for Indian brands due to packaging, return shipping ratios (RTO), and cash-on-delivery (COD) collection fees.</li>
                  <li><strong>2.5x to 3.5x</strong>: The typical break-even or entry profitability zone for most lifestyle and clothing categories.</li>
                  <li><strong>4.0x or higher</strong>: Excellent campaign health. Scalable budget territory.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How to Improve Your Ad Spend ROAS</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Optimize Checkout Conversion Rates</strong>: If you double your store conversion rate from 1.5% to 3.0% with a clean one-click checkout, you instantly double your ROAS without spending more on ads.</li>
                <li><strong>Combat Abandoned Carts via WhatsApp</strong>: Since over 70% of shoppers abandon checkout, setting up automated WhatsApp recovery alerts salvages lost sales at zero incremental ad spend.</li>
                <li><strong>Verify COD orders with OTP</strong>: Reducing the Return-to-Origin (RTO) rate ensures more recorded "purchases" translate to real cash, preserving your budget.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: What is CPA and how does it relate to ROAS?</p>
                  <p>A: CPA stands for Cost Per Acquisition (or Cost Per Purchase). While ROAS evaluates overall budget multipliers, CPA shows exactly how many ad Rupees it takes to win a single customer order. Lowering CPA boosts ROAS.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Why does my Meta Ads Manager show a different ROAS than my store dashboard?</p>
                  <p>A: Ad platforms use attribution windows (usually 7-day click or 1-day view) and sometimes double-count conversions, or miss them entirely due to iOS tracking blockages. A server-side Conversions API (CAPI) is needed to reconcile statistics.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Double Your ROAS with LaunchGrid Checkouts
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                LaunchGrid storefronts are speed-optimized for Indian shoppers. With native one-tap UPI payments, built-in COD fraud protection, and automatic WhatsApp cart recovery, your store converts more ad traffic into revenue.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Launch Your High-Converting Store <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
