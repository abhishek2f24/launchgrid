'use client';

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { EASE_EDITORIAL } from '@/lib/motion';
import { LaunchGridLogo } from '@/components/ui/LaunchGridLogo';
import { Menu, X } from 'lucide-react';

const TOOLS_OPTIONS = [
  { href: '/tools/gst-calculator', label: 'GST Calculator' },
  { href: '/tools/roas-calculator', label: 'ROAS Calculator' },
  { href: '/tools/profit-margin-calculator', label: 'Profit Margin' },
  { href: '/tools/ecommerce-pricing-calculator', label: 'Pricing Calculator' },
  { href: '/tools/whatsapp-message-generator', label: 'WhatsApp Generator' },
  { href: '/tools/store-name-generator', label: 'Store Name Generator' },
];

export function JourneyNav() {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);

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
          <Link
            href="/pricing"
            className="font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
          >
            Pricing
          </Link>
          <Link
            href="/vs-shopify"
            className="font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
          >
            Compare
          </Link>

          {/* Tools Hover Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsToolsOpen(true)}
            onMouseLeave={() => setIsToolsOpen(false)}
          >
            <button
              className="flex items-center gap-1 font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03] outline-none"
            >
              Tools
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <AnimatePresence>
              {isToolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1 w-60 bg-white border border-[var(--color-mark-default)] rounded-2xl shadow-xl p-3 z-50 flex flex-col gap-1"
                >
                  {TOOLS_OPTIONS.map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="font-inter text-[12px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] hover:bg-black/[0.03] transition-colors px-3 py-2 rounded-lg"
                    >
                      {tool.label}
                    </Link>
                  ))}
                  <div className="h-px bg-black/[0.04] my-1" />
                  <Link
                    href="/tools"
                    className="font-inter text-[11px] font-bold text-[var(--color-mark-ink)] hover:underline px-3 py-1.5"
                  >
                    Browse All Tools →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link
            href="/blog"
            className="font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
          >
            Blog
          </Link>
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
              <Link
                href="/pricing"
                onClick={() => setIsOpen(false)}
                className="font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors py-2 border-b border-black/[0.03]"
              >
                Pricing
              </Link>
              <Link
                href="/vs-shopify"
                onClick={() => setIsOpen(false)}
                className="font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors py-2 border-b border-black/[0.03]"
              >
                Compare
              </Link>

              {/* Tools on Mobile */}
              <div className="border-b border-black/[0.03]">
                <button
                  onClick={() => setIsMobileToolsOpen(!isMobileToolsOpen)}
                  className="w-full text-left flex justify-between items-center font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] py-2 outline-none"
                >
                  <span>Tools</span>
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isMobileToolsOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isMobileToolsOpen && (
                  <div className="pl-4 pb-2 flex flex-col gap-2.5">
                    {TOOLS_OPTIONS.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        onClick={() => {
                          setIsOpen(false);
                          setIsMobileToolsOpen(false);
                        }}
                        className="font-inter text-sm font-medium text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]"
                      >
                        {tool.label}
                      </Link>
                    ))}
                    <Link
                      href="/tools"
                      onClick={() => {
                        setIsOpen(false);
                        setIsMobileToolsOpen(false);
                      }}
                      className="font-inter text-sm font-bold text-[var(--color-mark-ink)]"
                    >
                      Browse All Tools →
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/blog"
                onClick={() => setIsOpen(false)}
                className="font-inter text-base font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors py-2 border-b border-black/[0.03]"
              >
                Blog
              </Link>
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
