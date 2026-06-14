'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JourneyNav } from '@/components/signup-journey/JourneyNav';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';
import { Footer } from '@/components/signup-journey/Footer';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, HelpCircle, CheckCircle } from 'lucide-react';

export default function GstCalculatorPage() {
  const [amount, setAmount] = useState<string>('10000');
  const [gstRate, setGstRate] = useState<number>(18);
  const [mode, setMode] = useState<'add' | 'remove'>('add');

  const parsedAmount = parseFloat(amount) || 0;
  let gstAmount = 0;
  let totalAmount = 0;
  let baseAmount = 0;

  if (mode === 'add') {
    baseAmount = parsedAmount;
    gstAmount = (parsedAmount * gstRate) / 100;
    totalAmount = parsedAmount + gstAmount;
  } else {
    totalAmount = parsedAmount;
    baseAmount = parsedAmount / (1 + gstRate / 100);
    gstAmount = totalAmount - baseAmount;
  }

  const cgst = gstAmount / 2;
  const sgst = gstAmount / 2;
  const igst = gstAmount;

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 w-full pt-32 pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-mark-subtle-text)] bg-black/[0.04] px-3 py-1 rounded-full mb-3 inline-block font-semibold">
              Tax Utilities
            </span>
            <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] leading-tight mb-4">
              GST Calculator India
            </h1>
            <p className="font-inter text-xs md:text-sm text-[var(--color-mark-secondary)] max-w-xl mx-auto leading-relaxed">
              Calculate CGST, SGST, IGST, and base values for Indian tax slabs (5%, 12%, 18%, 28%) with instant add/remove parameters.
            </p>
          </div>

          {/* Calculator Tool UI */}
          <div className="bg-white rounded-[2.5rem] border border-[var(--color-mark-default)] p-6 md:p-10 shadow-[0_12px_40px_rgba(26,26,24,0.05)] mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              
              {/* Inputs */}
              <div className="space-y-6">
                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Select Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--color-mark-subtle)] rounded-xl border border-[var(--color-mark-default)]">
                    <button
                      onClick={() => setMode('add')}
                      className={`py-2 px-4 rounded-lg font-inter text-xs font-semibold transition-all ${
                        mode === 'add'
                          ? 'bg-white text-[var(--color-mark-ink)] shadow-sm'
                          : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
                      }`}
                    >
                      Add GST
                    </button>
                    <button
                      onClick={() => setMode('remove')}
                      className={`py-2 px-4 rounded-lg font-inter text-xs font-semibold transition-all ${
                        mode === 'remove'
                          ? 'bg-white text-[var(--color-mark-ink)] shadow-sm'
                          : 'text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]'
                      }`}
                    >
                      Remove GST
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    Amount (₹)
                  </label>
                  <div className="relative rounded-xl border border-[var(--color-mark-default)] shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[var(--color-mark-secondary)] font-inter text-sm font-semibold pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="block w-full pl-8 pr-4 py-3 bg-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)]"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-inter text-xs font-bold text-[var(--color-mark-ink)] uppercase tracking-wider mb-2.5">
                    GST Rate Slab (%)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setGstRate(rate)}
                        className={`py-2.5 rounded-xl border font-inter text-xs font-bold transition-all ${
                          gstRate === rate
                            ? 'bg-[var(--color-mark-ink)] border-[var(--color-mark-ink)] text-white'
                            : 'border-[var(--color-mark-default)] text-[var(--color-mark-secondary)] hover:border-[var(--color-mark-ink)] hover:text-[var(--color-mark-ink)]'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Outputs */}
              <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="font-inter text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-subtle-text)] border-b border-[var(--color-mark-default)] pb-3">
                    Calculated Summary
                  </p>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Base Amount:</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{baseAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>Total GST ({gstRate}%):</span>
                    <span className="font-semibold text-[var(--color-mark-ink)]">₹{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="border-t border-dashed border-[var(--color-mark-default)] my-2" />

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>CGST (Intrastate - 50%):</span>
                    <span>₹{cgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>SGST (Intrastate - 50%):</span>
                    <span>₹{sgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-inter text-[var(--color-mark-secondary)]">
                    <span>IGST (Interstate - 100%):</span>
                    <span>₹{igst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-mark-default)] flex justify-between items-center">
                  <span className="font-playfair text-base font-bold text-[var(--color-mark-ink)]">Total Amount:</span>
                  <span className="font-inter text-xl font-bold text-[var(--color-mark-green)]">
                    ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* SEO Content Section */}
          <article className="prose prose-neutral max-w-none text-[var(--color-mark-secondary)] font-inter text-xs leading-relaxed space-y-8">
            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">How GST Works in India</h2>
              <p className="mb-4">
                Goods and Services Tax (GST) is an indirect tax levied on the supply of goods and services. Since its implementation in July 2017, GST replaced a web of multiple central and state taxes like VAT, Service Tax, and Excise Duty.
              </p>
              <p>
                When selling products online within India, taxes are split depending on location:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>CGST & SGST (Intrastate Sales)</strong>: Applied when the merchant and buyer are in the same state. The GST rate is split equally between the Central Government (CGST) and State Government (SGST).</li>
                <li><strong>IGST (Interstate Sales)</strong>: Applied when the merchant and buyer are in different states. The entire GST rate goes as Integrated GST (IGST) to the central administration before redistribution.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">GST Calculation Formulas</h2>
              <p className="mb-2"><strong>1. To Add GST:</strong></p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px] mb-4">
                GST Amount = (Base Amount * GST Rate) / 100
                Total Amount = Base Amount + GST Amount
              </pre>
              <p className="mb-2"><strong>2. To Remove/Extract GST:</strong></p>
              <pre className="bg-[var(--color-mark-subtle)] p-4 rounded-xl border border-[var(--color-mark-default)] font-mono text-[11px]">
                Base Amount = Total Amount / (1 + (GST Rate / 100))
                GST Amount = Total Amount - Base Amount
              </pre>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Example Calculations</h2>
              <div className="bg-white border border-[var(--color-mark-default)] rounded-[2rem] p-6 space-y-4 shadow-sm">
                <p><strong>Example 1 (Add GST on ₹5,000 at 18% slab):</strong></p>
                <p className="pl-4">
                  - GST Amount = (5,000 * 18) / 100 = ₹900<br />
                  - Total Billing Amount = 5,000 + 900 = ₹5,900<br />
                  - (If Intrastate: CGST = ₹450, SGST = ₹450)
                </p>
                <p><strong>Example 2 (Extract GST from a ₹10,000 billing amount at 12%):</strong></p>
                <p className="pl-4">
                  - Base Product Cost = 10,000 / 1.12 = ₹8,928.57<br />
                  - Tax Amount = 10,000 - 8,928.57 = ₹1,071.43
                </p>
              </div>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Common GST Registration Mistakes for D2C Brands</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Assuming registration is immediately required</strong>: In India, physical goods sellers do not need to register for GST until annual turnover exceeds ₹40 Lakhs (₹20 Lakhs in Special Category states) or if selling across state boundaries in specific categories.</li>
                <li><strong>Incorrect CGST/SGST splitting</strong>: Incorrectly charging SGST instead of IGST on interstate dropshipping orders leads to audit issues.</li>
                <li><strong>Failing to file nil returns</strong>: Even if you had zero transactions in a month, you must file a GSTR-1 and GSTR-3B nil return to prevent daily late fees.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-4">Frequently Asked Questions (FAQ)</h2>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: Can I dropship or sell online without a GSTIN?</p>
                  <p>A: Yes. You can register your store and sell within your own state up to the threshold of ₹40 Lakhs without a GSTIN. If doing interstate shipping or using automated logistics APIs, carriers might require a GSTIN or Enrolment ID for tax invoicing.</p>
                </div>
                <div>
                  <p className="font-bold text-[var(--color-mark-ink)]">Q: What is the GST rate for typical ecommerce items?</p>
                  <p>A: Most apparel, accessories, and shoes under ₹1,000 are taxed at 5%, while those above are at 12%. Electronics and general consumer goods typically fall under the 18% slab, while luxury items go up to 28%.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[var(--color-mark-subtle)] border border-[var(--color-mark-default)] rounded-[2rem] p-8 text-center mt-12">
              <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-3">
                Let LaunchGrid Handle Your GST Splits Natively
              </h3>
              <p className="mb-6 max-w-xl mx-auto text-xs">
                Forget complex calculations. LaunchGrid automatically structures GSTR-compliant tax invoices, splits CGST/SGST/IGST dynamically based on customer pincode, and helps you track your turnover thresholds.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-3.5 px-8 rounded-full hover:bg-black transition-all shadow-md"
              >
                Launch Your Compliant Store Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
