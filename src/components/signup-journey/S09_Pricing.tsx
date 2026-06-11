'use client';

import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { pricingMissions } from '@/data/landing/content';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { SectionReveal } from '../ui-landing/SectionReveal';
import { SignupForm } from './SignupForm';

const planMap: Record<string, string> = {
  "Get Online": "starter",
  "Get Customers": "pro",
  "Scale Revenue": "premium"
};

const priceMap: Record<string, { monthly: string; annualRate: string; annualTotal: string; originalMonthly: string; originalAnnualRate: string }> = {
  "Get Online": { monthly: "₹1,999", annualRate: "₹1,399", annualTotal: "₹16,788", originalMonthly: "₹4,999", originalAnnualRate: "₹3,499" },
  "Get Customers": { monthly: "₹9,999", annualRate: "₹6,999", annualTotal: "₹83,988", originalMonthly: "₹19,999", originalAnnualRate: "₹13,999" },
  "Scale Revenue": { monthly: "₹24,999", annualRate: "₹17,999", annualTotal: "₹2,15,888", originalMonthly: "₹49,999", originalAnnualRate: "₹34,999" }
};

export default function S09_Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <section id="pricing" className="py-32 w-full bg-[var(--color-mark-base)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        {/* No SectionReveal here — section is anchor-targeted (#pricing), so it must never start invisible */}
        <div className="text-center mb-16">
          <ChapterLabel chapter="Chapter 08" label="Choose Your Mission" />
          <EditorialHeadline text={"Not just a plan.\nA path to your first ₹1,00,000."} size="lg" />
        </div>

        {/* Annual/Monthly Toggle */}
        <div className="flex justify-center items-center gap-4 mb-16 font-inter">
          <span className={`text-xs font-bold uppercase tracking-wider ${!isAnnual ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]/50'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(prev => !prev)}
            className="w-14 h-8 rounded-full p-1 bg-[var(--color-mark-ink)] flex items-center transition-all duration-300 shadow-inner"
          >
            <motion.div
              className="w-6 h-6 rounded-full bg-white shadow-md"
              initial={{ x: 0 }}
              animate={{ x: isAnnual ? 24 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isAnnual ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]/50'}`}>
            Annually
            <span className="bg-green-100 text-green-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest animate-pulse">
              Save 30%
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {pricingMissions.map((mission, idx) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              index={idx}
              isAnnual={isAnnual}
              isSelected={selectedPlan === mission.name}
              onSelect={() => setSelectedPlan(selectedPlan === mission.name ? null : mission.name)}
            />
          ))}
        </div>

        {/* Inline Signup Form — expands when a plan is selected */}
        <AnimatePresence>
          {selectedPlan && (
            <motion.div
              key="inline-signup"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 48 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <p className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]">
                    Starting with <span className="text-[var(--color-mark-ink)]">{selectedPlan}</span>
                  </p>
                  <p className="font-inter text-sm text-[var(--color-mark-secondary)] mt-1">
                    Create your account and your store will be ready in minutes.
                  </p>
                </div>
                <Suspense fallback={<div className="h-[400px] w-full max-w-sm animate-pulse bg-[var(--color-mark-muted)] rounded-2xl" />}>
                  <SignupForm />
                </Suspense>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="font-inter text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
                >
                  ← Back to plans
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}

function MissionCard({
  mission,
  index,
  isAnnual,
  isSelected,
  onSelect,
}: {
  mission: any;
  index: number;
  isAnnual: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isPopular = mission.popular;
  const planCode = planMap[mission.name] || 'starter';
  const pricingDetail = priceMap[mission.name] || { monthly: mission.price, annualRate: "", annualTotal: "" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: isPopular ? -16 : 0 }}
      viewport={{ once: true, margin: '150px 0px -30px 0px' }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 100, damping: 20 }}
      className={`relative bg-white rounded-[2rem] p-8 md:p-10 flex flex-col transition-shadow ${
        isSelected
          ? 'border-2 border-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.15)] ring-0'
          : isPopular
          ? 'border-2 border-[var(--color-mark-ink)] shadow-[0_32px_80px_rgba(26,26,24,0.12)] z-10'
          : 'border border-[var(--color-mark-default)] shadow-[0_4px_16px_rgba(26,26,24,0.04)] hover:shadow-[0_16px_48px_rgba(26,26,24,0.08)]'
      }`}
    >
      {isPopular && !isSelected && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--color-mark-ink)] text-white font-inter text-[10px] font-bold tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md">
          Most Popular
        </div>
      )}
      {isSelected && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white font-inter text-[10px] font-bold tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md">
          Selected ✓
        </div>
      )}

      {/* Watermark */}
      <div className="absolute top-4 right-4 text-[6rem] font-playfair font-bold text-[var(--color-mark-ink)] opacity-[0.03] pointer-events-none select-none leading-none">
        {mission.id}
      </div>

      <div className="mb-8 relative z-10">
        <span className="font-inter text-[10px] font-bold text-[var(--color-mark-subtle-text)] tracking-widest uppercase block mb-4">
          Mission {mission.id}
        </span>
        <h3 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">{mission.name}</h3>
        <p className="font-inter italic text-[var(--color-mark-secondary)] text-sm mb-6 min-h-[40px]">{mission.tagline}</p>

        <div>
          <div className="font-inter font-bold text-3xl text-[var(--color-mark-ink)] flex items-baseline flex-wrap gap-x-2">
            {pricingDetail.originalMonthly && (
              <span className="font-inter text-sm text-red-500 line-through opacity-75">
                {isAnnual ? pricingDetail.originalAnnualRate : pricingDetail.originalMonthly}
              </span>
            )}
            <span>{isAnnual ? pricingDetail.annualRate : pricingDetail.monthly}</span>
            <span className="text-xs font-semibold text-[var(--color-mark-secondary)]/60 ml-1">/ month</span>
          </div>
          {isAnnual && (
            <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">
              Billed Annually ({pricingDetail.annualTotal}/yr)
            </p>
          )}
        </div>
      </div>

      <div className="w-full h-px bg-[var(--color-mark-default)] mb-8" />

      <ul className="flex flex-col gap-4 mb-10 flex-1 relative z-10">
        {mission.features.map((feat: string, i: number) => (
          <li key={i} className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-mark-green)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-inter text-sm text-[var(--color-mark-secondary)]">{feat}</span>
          </li>
        ))}
      </ul>

      {/* CTA: click to select plan and expand inline form */}
      <button
        onClick={onSelect}
        classNa