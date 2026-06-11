'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChapterLabel } from '../ui-landing/ChapterLabel';
import { EditorialHeadline } from '../ui-landing/EditorialHeadline';
import { MetricTicker } from '../ui-landing/MetricTicker';

const phrases = [
  "I need a logo.",
  "I need a website.",
  "I need payment processing.",
  "I need customers.",
  "I don't know where to begin."
];

// Safe fallback values — shown immediately before real data loads
const FALLBACK_STORES = 1200
const FALLBACK_REVENUE = 23000000

export default function S01_TheThought() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [storeCount, setStoreCount] = useState(FALLBACK_STORES)
  const [totalRevenue, setTotalRevenue] = useState(FALLBACK_REVENUE)

  // Fetch real platform stats (cached 5 min on server)
  useEffect(() => {
    fetch('/api/stats/platform')
      .then(r => r.json())
      .then(d => {
        if (d.storeCount > 0) setStoreCount(d.storeCount)
        if (d.totalRevenue > 0) setTotalRevenue(d.totalRevenue)
      })
      .catch(() => {}) // fallback stays on error
  }, [])
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Map progress to an index 0-4
  const phraseIndex = useTransform(scrollYProgress, 
    [0, 0.2, 0.4, 0.6, 0.8], 
    [0, 1, 2, 3, 4]
  );
  
  // Snap the exact integer index to pass to AnimatePresence
  // We use a small hack by tracking it in a state or just relying on mapping,
  // but useTransform returns a MotionValue. Let's create a functional component for the morph text.

  return (
    <section ref={containerRef} className="h-[300vh] relative w-full bg-[var(--color-mark-base)]">
      {/* Sticky container that holds the content in viewport */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-6 pt-28">
        
        <motion.div 
          className="max-w-4xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChapterLabel chapter="Chapter 01" label="The Thought" />
          
          <EditorialHeadline 
            text={"I've been thinking about\nstarting a business\nfor two years."} 
            size="xl"
            className="mb-8"
          />

          <p className="body-lg text-[var(--color-mark-secondary)] max-w-lg mx-auto">
            Most people never start.
            Not because they lack ideas.
            Because they don't know what comes next.
          </p>

          {/* Live Stats Tickers (Social Trust) */}
          <div className="mt-10 flex flex-wrap justify-center gap-8 md:gap-16 text-center relative z-20">
            <div>
              <div className="font-playfair text-3xl md:text-4xl font-black text-[var(--color-mark-ink)]">
                <MetricTicker initialValue={storeCount} interval={5000} minIncrement={1} maxIncrement={2} />
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--color-mark-secondary)] mt-1">Stores Created</p>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[var(--color-mark-default)]" />
            <div>
              <div className="font-playfair text-3xl md:text-4xl font-black text-[var(--color-mark-ink)]">
                <MetricTicker initialValue={totalRevenue} interval={3000} minIncrement={350} maxIncrement={950} prefix="₹" />
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[var(--color-mark-secondary)] mt-1">Revenue Processed</p>
            </div>
          </div>

          {/* Morphing text area */}
          <div className="h-32 mt-16 relative flex items-center justify-center">
            <MorphText progress={scrollYProgress} />
          </div>

          <motion.div 
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <span className="caption text-[var(--color-mark-muted)]">Scroll</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="stroke-[var(--color-mark-muted)]">
              <path d="M6 9L12 15L18 9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function MorphText({ progress }: { progress: any }) {
  // Use framer motion hooks to detect nearest integer
  const index = useTransform(progress, [0, 0.15, 0.35, 0.55, 0.75, 0.95], [0, 0, 1, 2, 3, 4]);
  // We need to trigger re-renders when index changes
  return <MorphTextInner indexMotionValue={index} />;
}

function MorphTextInner({ indexMotionValue }: { indexMotionValue: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    return indexMotionValue.on("change", (latest: number) => {
      setCurrentIndex(Math.round(latest));
    });
  }, [indexMotionValue]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        className="absolute w-full font-playfair text-2xl md:text-4xl text-[var(--color-mark-ink)] italic"
        initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -16, filter: 'blur(2px)' }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      >
        "{phrases[Math.min(currentIndex, phrases.length - 1)]}"
      </motion.div>
    </AnimatePresence>
  );
}
