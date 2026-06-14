'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, HelpCircle } from 'lucide-react';

export default function EcommercePricingCalculatorPage() {
  const [cogs, setCogs] = useState<string>('400');
  const [shipping, setShipping] = useState<string>('60');
  const [packaging, setPackaging] = useState<string>('15');
  const [pgFeePct, setPgFeePct] = useState<string>('2');
  const [cac, setCac] = useState<string>('200');
  const [targetMargin, setTargetMargin] = useState<string>('20');

  const parsedCogs = parseFloat(cogs) || 0;
  const parsedShipping = parseFloat(shipping) || 0;
  const parsedPackaging = parseFloat(packaging) || 0;
  const parsedPgFeePct = parseFloat(pgFeePct) || 0;
  const parsedCac = parseFloat(cac) || 0;
  const parsedTargetMargin = parseFloat(targetMargin) || 0;

  // Let recommended selling price be SP
  // SP = (COGS + Shipping + Packaging + CAC) / (1 - (TargetMargin/100) - (PGFeePct/100))
  const totalFixedCosts = parsedCogs + parsedShipping + parsedPackaging + parsedCac;
  const divisor = 1 - (parsedTargetMargin / 100) - (parsedPgFeePct / 100);
  const recommendedPrice = divisor > 0 ? totalFixedCosts / divisor : 0;

  const pgFeeAmount = (recommendedPrice * parsedPgFeePct) / 100;
  const estimatedProfit = recommendedPrice > 0 ? (recommendedPrice * parsedTargetMargin) / 100 : 0;

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Pricing Strategy
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Ecommerce Pricing Calculator
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Find the perfect retail price for your D2C goods by accounting for sourcing, packing, shipping, gateway percentages, CAC, and target margins.
            </p>
          </div>

          {/* Calculator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                    Product Sourcing / COGS (₹)
                  </label>
                  <input
                    type="number"
                    value={cogs}
                    onChange={(e) => setCogs(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                    placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                      Shipping (₹)
                    </label>
                    <input
                      type="number"
                      value={shipping}
                      onChange={(e) => setShipping(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                      Packaging (₹)
                    </label>
                    <input
                      type="number"
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                      Gateway Fee (%)
                    </label>
                    <input
                      type="number"
                      value={pgFeePct}
                      onChange={(e) => setPgFeePct(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="2"
                    />
                  </div>
                  <div>
                    <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                      Ad Spend / CAC (₹)
                    </label>
                    <input
                      type="number"
                      value={cac}
                      onChange={(e) => setCac(e.target.value)}
                      className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-1.5">
                    Target Net Margin (%)
                  </label>
                  <input
                    type="number"
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(e.target.value)}
                    className="block w-full px-4 py-2.5 bg-white border border-[var(--color-mark-default)] rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                    placeholder="20"
                  />
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3">
                    Calculated Recommendation
                  </p>

                  <div className="text-center py-4">
                    <span className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)]">Recommended Selling Price</span>
                    <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-green)] mt-2">
                      ₹{recommendedPrice > 0 ? Math.round(recommendedPrice).toLocaleString('en-IN') : '0'}
                    </h2>
                  </div>

                  <div className="border-t border-dashed border-[var(--color-mark-default)] my-2" />

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Variable Costs Sum:</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{totalFixedCosts.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Gateway Fee (approx):</span>
                    <span>₹{pgFeeAmount.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Target Net Profit:</span>
                    <span className="font-semibold text-[var(--color-mark-green)]">₹{estimatedProfit.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-mark-default)] text-center text-[10px] text-[var(--color-mark-subtle-text)]">
                  Prices are rounded to the nearest Rupee.
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How to Price Your Products for D2C</h2>
              <p className="mb-4">
                Setting the right retail price for your online store is about much more than multiplying the manufacturer cost by two. Indian ecommerce has distinct variable charges like cash-on-delivery (COD) logistics, high return ratios, packaging costs, and ad acquisition costs that must be mapped directly into your final retail tag.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Pricing Formula Breakdown</h2>
              <p className="mb-2">To guarantee you achieve your target profit percentage after paying for ads, packaging, gateways, and shipping, use this equation:</p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4">
                Selling Price = Total Costs / (1 - Target Margin% - Gateway Fee%)
              </pre>
              <p className="mb-2">Where Total Costs represents the sum of COGS, Packaging, Shipping, and Customer Acquisition Cost (CAC):</p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border(--color-mark-default) font-mono text-[11px]">
                Total Costs = COGS + Shipping + Packaging + CAC
              </pre>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Why Traditional Markup Strategies Fail</h2>
              <p>
                Many beginners buy an item for ₹300, markup by 100% to sell at ₹600, and assume they made ₹300 profit. In reality:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Shipping costs ₹60.</li>
                <li>Packaging box costs ₹15.</li>
                <li>Meta ads cost ₹200 (CAC) per purchase.</li>
                <li>Payment gateway charges ₹12 (2%).</li>
                <li>True Cost = 300 + 60 + 15 + 200 + 12 = ₹587.</li>
                <li>Actual Net Profit = ₹13, a razor-thin 2.1% net margin.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Key Costs to Factor In</h2>
              <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-6 space-y-4 shadow-sm">
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Logistics Rates</strong>: Average local delivery costs ₹40–₹50, whereas national shipping starts at ₹60–₹90 for standard 500g packages.</li>
                  <li><strong>COD Premium</strong>: COD collection commands an extra ₹30–₹45 per delivery from courier networks.</li>
                  <li><strong>Advertising CAC</strong>: If your store conversion rate is 2% and it costs ₹5 per click, you need 50 visitors to get 1 sale. Your CAC is 50 * 5 = ₹250.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Should I offer free shipping on my store?</p>
                  <p>A: Yes. Indian shoppers are highly sensitive to shipping fees at checkout. However, "free" shipping means you must bundle the ₹60 logistics fee into the listing price of the item itself.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: How do returns affect my pricing calculations?</p>
                  <p>A: High Return-to-Origin (RTO) rates require you to include an RTO buffer fee. If your RTO rate is 20%, you should add 20% of your shipping costs as a buffer to the overall pricing calculation.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Stop Paying Third-Party Commissions Natively
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                LaunchGrid charges 0% transaction fees, helping you keep your prices competitive while protecting your bottom line. Launch your store in 15 minutes and direct all revenue straight to your bank account.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Launch Your Compliant Store <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
