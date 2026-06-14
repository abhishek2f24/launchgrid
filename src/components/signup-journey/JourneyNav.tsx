'use client';

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { EASE_EDITORIAL } from '@/lib/motion';
import { LaunchGridLogo } from '@/components/ui/LaunchGridLogo';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/vs-shopify', label: 'Compare' },
  { href: '/blog', label: 'Blog' },
];

export function JourneyNav() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 80);
  });

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 flex items-center justify-between py-4 px-6 md:px-12 ${
          isScrolled || isOpen
            ? 'bg-[var(--color-mark-base)]/95 backdrop-blur-md border-b border-[var(--color-mark-default)]'
            : 'bg-transparent border-b border-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
      >
        <Link href="/" className="flex items-center group outline-none transition-opacity hover:opacity-80 relative z-50">
          <LaunchGridLogo size={28} variant="light" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
          >
            Log in
          </Link>
          <Link
            href="/onboarding"
            className="ml-2 bg-[var(--color-mark-ink)] text-white font-inter text-[13px] font-bold py-2.5 px-5 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-md"
          >
            Start free
          </Link>
        </div>

        {/* Mobile Navigation Toggle */}
        <div className="flex md:hidden items-center gap-3 relative z-50">
          <Link
            href="/onboarding"
            className="bg-[var(--color-mark-ink)] text-white font-inter text-[12px] font-bold py-2 px-4 rounded-xl hover:bg-black active:scale-[0.98] transition-all shadow-sm"
          >
            Start free
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors rounded-lg hover:bg-black/[0.03] outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 w-full bg-[var(--color-mark-base)] border-b border-[var(--color-mark-default)] pt-24 pb-8 px-6 shadow-xl flex flex-col gap-4 md:hidden z-40"
            >
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors py-2 border-b border-black/[0.03]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors py-2 border-b border-black/[0.03]"
              >
                Log in
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
