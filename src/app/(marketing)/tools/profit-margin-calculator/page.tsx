'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { ArrowRight } from 'lucide-react';
import { PROFIT_MARGIN_EXAMPLES, PROFIT_MARGIN_FAQS } from './content';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

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
              Free Profit Margin Calculator for Products
            </h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)] max-w-2xl mx-auto leading-relaxed">
              <strong className="text-[var(--color-mark-ink)]">Profit margin = (selling price − cost) ÷ selling price × 100.</strong>{' '}
              Enter what the product costs you, what you sell it for, and your per-order expenses (shipping,
              packaging, gateway fees, returns). You get gross margin, net margin and markup instantly, in rupees.
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
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4 whitespace-pre-wrap">
                Gross Profit = Selling Price - Cost of Goods Sold (COGS)
                Profit Margin % = (Gross Profit / Selling Price) * 100
              </pre>
              <p className="mb-2"><strong>2. Markup Formula:</strong></p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] whitespace-pre-wrap">
                Markup % = (Gross Profit / COGS) * 100
              </pre>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How to Find Your Selling Price From a Target Margin</h2>
              <p className="mb-4">
                Work backwards from the margin you need, not forwards from cost. Add up everything one order costs
                you, then divide by one minus your target margin:
              </p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4 whitespace-pre-wrap">
                Selling price = Total cost per order ÷ (1 − target margin)
                Example: ₹600 ÷ (1 − 0.40) = ₹1,000 for a 40% margin
              </pre>
              <p>
                If you&apos;re GST-registered, this is the price <strong>before</strong> GST. Add GST on top, because the
                tax you collect isn&apos;t your revenue. Check the tax part with the{' '}
                <Link href="/tools/gst-calculator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">GST calculator</Link>.
                To build a full price including ad spend per order, use the{' '}
                <Link href="/tools/ecommerce-pricing-calculator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">ecommerce pricing calculator</Link>.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Worked Examples for Indian Online Sellers</h2>
              <p className="mb-4">
                Three example products, with every per-order cost written out. The numbers are illustrative, so swap
                in your own supplier and courier quotes.
              </p>
              <div className="overflow-x-auto bg-white border border-[var(--color-mark-default)] rounded-2xl shadow-sm">
                <table className="w-full text-left text-[11px] md:text-xs">
                  <thead className="bg-[var(--color-mark-subtle)] text-[var(--color-mark-ink)]">
                    <tr>
                      <th className="p-3 font-bold">Product</th>
                      <th className="p-3 font-bold">Cost</th>
                      <th className="p-3 font-bold">Price</th>
                      <th className="p-3 font-bold">Per-order costs</th>
                      <th className="p-3 font-bold">Gross margin</th>
                      <th className="p-3 font-bold">Net profit</th>
                      <th className="p-3 font-bold">Net margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROFIT_MARGIN_EXAMPLES.map((ex) => {
                      const net = ex.price - ex.cost - ex.expenses;
                      return (
                        <tr key={ex.label} className="border-t border-[var(--color-mark-default)] align-top">
                          <td className="p-3">
                            <span className="font-bold text-[var(--color-mark-ink)] block">{ex.label}</span>
                            <Link href={ex.href} className="underline underline-offset-2">{ex.anchor}</Link>
                          </td>
                          <td className="p-3">{inr(ex.cost)}</td>
                          <td className="p-3">{inr(ex.price)}</td>
                          <td className="p-3">{inr(ex.expenses)}<span className="block text-[10px] text-[var(--color-mark-subtle-text)]">{ex.expenseNote}</span></td>
                          <td className="p-3">{(((ex.price - ex.cost) / ex.price) * 100).toFixed(0)}%</td>
                          <td className="p-3 font-bold text-[var(--color-mark-ink)]">{inr(net)}</td>
                          <td className="p-3 font-bold text-[var(--color-mark-ink)]">{((net / ex.price) * 100).toFixed(0)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-4">
                Look at the vase. Its 68% gross margin looks like the best of the three, but fragile shipping and a
                breakage buffer take away more than 20 points. The phone case goes from 72% gross to 40% net. That&apos;s
                why you should always check net margin before you set a price.
              </p>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Common Mistakes When Setting Prices</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confusing markup with margin</strong>: a 50% markup on cost is only a 33% margin on price.</li>
                <li><strong>Calculating margin on the GST-inclusive price</strong>: the tax is not your money, so it inflates your margin on paper.</li>
                <li><strong>Ignoring payment gateway fees</strong>: around 2% per prepaid order adds up across thousands of orders.</li>
                <li><strong>Forgetting COD returns (RTO)</strong>: every refused COD parcel costs two-way shipping with no sale. Spread that cost across the orders that succeed.</li>
                <li><strong>Treating ad spend as overhead</strong>: if each order costs ₹150 in Meta ads, that ₹150 belongs in the per-order cost. Check it with the <Link href="/tools/roas-calculator" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">ROAS calculator</Link>.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {PROFIT_MARGIN_FAQS.map((faq) => (
                  <div key={faq.q}>
                    <h3 className="font-bold text-[var(--color-mark-ink)] text-sm">{faq.q}</h3>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Pricing Guides by Category</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><Link href="/blog/mobile-accessories-business-margins-sourcing" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">Mobile accessories margins and sourcing</Link>: what phone cases, chargers and earbuds really make after shipping.</li>
                <li><Link href="/blog/how-to-price-sarees-online" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">How to price sarees online</Link>: pricing, shipping and returns for saree sellers.</li>
                <li><Link href="/blog/ship-home-decor-without-breakage" className="font-bold underline underline-offset-2 text-[var(--color-mark-ink)]">Shipping fragile home decor</Link>: packaging costs and breakage buffers.</li>
              </ul>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Keep More of Every Sale
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                LaunchGrid charges 0% transaction fees on all paid plans. Every Rupee your customers pay goes straight to your account, protecting your margins from typical platform commission cuts (e.g., Dukaan charges up to 2.99%).
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Create your free online store <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
