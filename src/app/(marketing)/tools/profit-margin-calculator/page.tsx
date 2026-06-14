'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { Percent, ArrowRight, HelpCircle } from 'lucide-react';

export default function ProfitMarginCalculatorPage() {
  const [cogs, setCogs] = useState<string>('500');
  const [sellingPrice, setSellingPrice] = useState<string>('1500');
  const [otherExpenses, setOtherExpenses] = useState<string>('300');

  const parsedCogs = parseFloat(cogs) || 0;
  const parsedPrice = parseFloat(sellingPrice) || 0;
  const parsedExpenses = parseFloat(otherExpenses) || 0;

  // Gross Calculations
  const grossProfit = parsedPrice - parsedCogs;
  const grossMargin = parsedPrice > 0 ? (grossProfit / parsedPrice) * 100 : 0;
  const markup = parsedCogs > 0 ? (grossProfit / parsedCogs) * 100 : 0;

  // Net Calculations
  const netProfit = parsedPrice - parsedCogs - parsedExpenses;
  const netMargin = parsedPrice > 0 ? (netProfit / parsedPrice) * 100 : 0;

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Finance Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              Profit Margin Calculator
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Calculate D2C sales margins, markup percentages, gross profits, and net margins by factoring in sourcing and operational costs.
            </p>
          </div>

          {/* Calculator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Cost of Goods Sold / COGS (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={cogs}
                      onChange={(e) => setCogs(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="Product sourcing cost"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Selling Price (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="Retail price to customer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Other Expenses (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={otherExpenses}
                      onChange={(e) => setOtherExpenses(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="Logistics, packaging, marketing"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--color-mark-subtle-text)] mt-1.5 block font-medium">
                    Include shipping costs, box packaging, payment gateway, and Meta acquisition budgets.
                  </span>
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3">
                    Margin Metrics
                  </p>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Gross Profit:</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Gross Margin (%):</span>
                    <span className="font-semibold text-[var(--color-mark-green)]">{grossMargin.toFixed(2)}%</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Markup Value (%):</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">{markup.toFixed(2)}%</span>
                  </div>

                  <div className="border-t border-dashed border-[var(--color-mark-default)] my-2" />

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Net Profit:</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{netProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Net Margin (%):</span>
                    <span className={`font-bold ${netProfit >= 0 ? 'text-[var(--color-mark-green)]' : 'text-red-500'}`}>
                      {netMargin.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-mark-default)] text-center text-[10px] text-[var(--color-mark-subtle-text)]">
                  Keep a target net margin above 15% for sustainable scaling.
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Margin vs Markup: The Crucial Difference</h2>
              <p className="mb-4">
                D2C entrepreneurs often mistake markup for margin, leading to mispriced catalogs and lost profits. Although both look at the gap between COGS and price, their base references are entirely distinct:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Gross Margin</strong>: Shows the percentage of revenue that is profit. It is calculated by dividing profit by the <strong>selling price</strong>. If you buy for ₹500 and sell for ₹1,500, your gross margin is 66.7%.</li>
                <li><strong>Markup</strong>: Shows how much you increase the cost of a product to reach its selling price. It is calculated by dividing profit by the <strong>original cost (COGS)</strong>. If you buy for ₹500 and sell for ₹1,500, your markup is 200%.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">The Mathematical Formulas</h2>
              <p className="mb-2"><strong>1. Gross Profit Margin Formula:</strong></p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4">
                Gross Profit = Selling Price - Cost of Goods Sold (COGS)
                Profit Margin % = (Gross Profit / Selling Price) * 100
              </pre>
              <p className="mb-2"><strong>2. Markup Formula:</strong></p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px]">
                Markup % = (Gross Profit / COGS) * 100
              </pre>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Typical Product Margins in Indian D2C Industries</h2>
              <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-6 space-y-4 shadow-sm">
                <p>Standard benchmarks across Indian ecommerce sectors include:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Fashion & Accessories</strong>: 60% – 80% Gross Margin. Sourcing is cheap (Surat, Ludhiana), but high return rates (RTOs) require higher initial retail buffers.</li>
                  <li><strong>Cosmetics & Personal Care</strong>: 70% – 85% Gross Margin. Low packaging volumes make shipping efficient, but high advertising CAC requires substantial margins.</li>
                  <li><strong>Electronics & Home Appliances</strong>: 15% – 30% Gross Margin. Heavy weights increase logistics fees, requiring high volumes to build overall net profit.</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Common Mistakes When Setting Pricing</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Ignoring Payment Gateway Fees</strong>: Standard gateway fees (1.9% to 3.0%) eat directly into net margin on thousands of monthly transactions.</li>
                <li><strong>Underestimating RTO (Return-to-Origin) Costs</strong>: In India, cash-on-delivery orders have a 30% return rate on average. When an order returns, you pay for both forward shipping and return logistics with no sales revenue to show for it.</li>
                <li><strong>Treating ad spend as optional overhead</strong>: Acquisition budgets (CAC) should be modeled directly into your initial cost structure.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: How do shipping fees affect profit margin calculation?</p>
                  <p>A: Shipping fees represent direct operational expenses. To calculate true net margin, you must subtract shipping costs from gross profit. Offering "Free Shipping" requires adjusting the base product retail price to absorb logistics fees.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: What is a healthy net profit margin target for a startup?</p>
                  <p>A: A target net margin between 15% and 25% is healthy. This ensures you can cover customer acquisition costs (CAC) while retaining a safety buffer for sudden inventory holding increases.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Cut Platform Overhead and Boost Your Store Margins
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                LaunchGrid charges 0% transaction fees on all paid plans. Every Rupee your customers pay goes straight to your account, protecting your margins from typical platform commission cuts (e.g., Dukaan charges up to 2.99%).
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Start Selling and Save Margins <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
