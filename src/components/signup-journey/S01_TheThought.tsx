'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
// (Link import removed — hero CTA is now the idea form)
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';

// Cycling placeholder ideas — real niches, not generic SaaS-speak
const IDEA_PLACEHOLDERS = [
  'handmade jewellery',
  'gym supplements',
  'home bakery',
  'thrifted streetwear',
  'organic skincare',
  'phone accessories',
];

export default function S01_TheThought() {
  // Real platform stats only — the strip renders once real data arrives.
  // No fabricated fallbacks, no fake increments: small-but-real beats big-but-fake.
  const router = useRouter()
  const [idea, setIdea] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [storeCount, setStoreCount] = useState<number | null>(null)
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null)

  // Cycle placeholder ideas every 2.5s while the field is empty
  useEffect(() => {
    if (idea) return
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % IDEA_PLACEHOLDERS.length), 2500)
    return () => clearInterval(t)
  }, [idea])

  const startBuilding = (e: React.FormEvent) => {
    e.preventDefault()
    const q = idea.trim()
    router.push(q ? `/onboarding?idea=${encodeURIComponent(q)}` : '/onboarding')
  }

  useEffect(() => {
    fetch('/api/stats/platform')
      .then(r => r.json())
      .then(d => {
        if (d.storeCount > 0) setStoreCount(d.storeCount)
        if (d.totalRevenue > 0) setTotalRevenue(d.totalRevenue)
      })
      .catch(() => {}) // strip simply stays hidden on error
  }, [])

  return (
    <section className="min-h-screen relative w-full bg-[var(--color-mark-base)] flex flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-24">

      {/* opacity removed from initial — text must be visible on first paint for LCP.
          y-only transform is fine (doesn't block LCP measurement). */}
      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10"
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <ChapterLabel chapter="Chapter 01" label="The Thought" />

        {/* priority=true → CSS-animated static render, LCP-safe (no JS opacity gate) */}
        <EditorialHeadline
          text={"You've thought about it\nfor years. Launch it\nin 15 minutes."}
          size="xl"
          priority
          as="h1"
          className="mb-8"
        />

        <p className="body-lg text-[var(--color-mark-secondary)] max-w-lg mx-auto">
          LaunchGrid turns your idea into a real online store —
          products, UPI &amp; COD payments, GST handled.
          Most people never start. You&apos;re about to.
        </p>

        {/* The hero IS the product: type your idea, start building */}
        <div className="mt-10 flex flex-col items-center gap-3 relative z-20">
          <form
            onSubmit={startBuilding}
            className="w-full max-w-xl flex items-stretch gap-0 bg-white border border-black/10 rounded-2xl shadow-[0_8px_40px_rgba(26,26,24,0.08)] focus-within:border-[var(--color-mark-amber,#FF8A00)] focus-within:shadow-[0_8px_40px_rgba(255,138,0,0.12)] transition-all overflow-hidden"
          >
            <label htmlFor="hero-idea" className="sr-only">What do you want to sell?</label>
            <input
              id="hero-idea"
              type="text"
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder={`I want to sell ${IDEA_PLACEHOLDERS[placeholderIdx]}…`}
              className="flex-1 min-w-0 px-5 py-4 font-inter text-[15px] font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/70 bg-transparent focus:outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              className="shrink-0 m-1.5 inline-flex items-center gap-2 bg-[var(--color-mark-ink)] text-white font-inter font-bold text-sm py-3 px-5 sm:px-7 rounded-xl hover:bg-black transition-all duration-200 active:scale-[0.98] group"
            >
              <span className="hidden sm:inline">Build my store</span>
              <span className="sm:hidden">Build</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
          <p className="font-inter text-xs font-medium text-[var(--color-mark-secondary)]">
            Free for 7 days · No credit card · Your store stays yours
          </p>
        </div>

        {/* Real platform stats — static, honest, hidden until real data loads */}
        {(storeCount !== null || totalRevenue !== null) && (
          <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-16 text-center relative z-20">
            {storeCount !== null && (
              <div>
                <div className="font-playfair text-3xl md:text-4xl font-black text-[var(--color-mark-ink)] tabular-nums">
                  {storeCount.toLocaleString('en-IN')}
                </div>
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-[var(--color-mark-secondary)] mt-1">Stores launched</p>
              </div>
            )}
            {storeCount !== null && totalRevenue !== null && (
              <div className="hidden sm:block w-px h-12 bg-[var(--color-mark-default)]" />
            )}
            {totalRevenue !== null && (
              <div>
                <div className="font-playfair text-3xl md:text-4xl font-black text-[var(--color-mark-ink)] tabular-nums">
                  ₹{totalRevenue.toLocaleString('en-IN')}
                </div>
                <p className="text-xs uppercase tracking-[0.15em] font-bold text-[var(--color-mark-secondary)] mt-1">Merchant sales to date</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <span className="caption text-[var(--color-mark-subtle-text)]">Scroll</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="stroke-[var(--color-mark-muted)]">
          <path d="M6 9L12 15L18 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </motion.div>
    </section>
  );
}
