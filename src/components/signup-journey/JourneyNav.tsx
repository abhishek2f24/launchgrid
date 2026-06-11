'use client';

import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { EASE_EDITORIAL } from '@/lib/motion';

export function JourneyNav() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 80);
  });

  return (
    <motion.nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center justify-between py-4 px-6 md:px-12 ${
        isScrolled 
          ? 'bg-[var(--color-mark-base)]/80 backdrop-blur-md border-b border-[var(--color-mark-default)]' 
          : 'bg-transparent border-b border-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
    >
      <Link href="/" className="flex items-center gap-2 group outline-none">
        <div className="w-8 h-8 rounded bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] flex items-center justify-center font-inter font-bold text-xs shadow-md transition-transform group-hover:scale-105">LG</div>
        <span className="font-playfair font-bold tracking-widest text-[11px] uppercase text-[var(--color-mark-ink)]">LaunchGrid</span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="font-inter text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
        >
          Login
        </Link>
        <Link
          href="/discover"
          className="font-inter text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
        >
          Discover
        </Link>
        <Link
          href="/pricing"
          className="hidden md:block font-inter text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/signup"
          className="bg-[var(--color-mark-ink)] text-white font-inter text-xs font-bold py-2.5 px-6 rounded-full hover:bg-black/90 active:scale-[0.98] transition-all shadow-md"
        >
          Get Started →
        </Link>
      </div>
    </motion.nav>
  );
}
