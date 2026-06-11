'use client';

import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';
import { EASE_EDITORIAL } from '@/lib/motion';
import { LaunchGridLogo } from '@/components/ui/LaunchGridLogo';

const NAV_LINKS = [
  { href: '/discover', label: 'Examples', always: true },
  { href: '/pricing', label: 'Pricing', always: true },
  { href: '/vs-shopify', label: 'Compare', always: false },
  { href: '/blog', label: 'Blog', always: false },
];

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
          ? 'bg-[var(--color-mark-base)]/90 backdrop-blur-md border-b border-[var(--color-mark-default)]'
          : 'bg-transparent border-b border-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: EASE_EDITORIAL }}
    >
      <Link href="/" className="flex items-center group outline-none transition-opacity hover:opacity-80">
        <LaunchGridLogo size={28} variant="dark" />
      </Link>

      <div className="flex items-center gap-1 md:gap-2">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`${link.always ? 'block' : 'hidden md:block'} font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]`}
          >
            {link.label}
          </Link>
        ))}
        <Link
          href="/login"
          className="hidden sm:block font-inter text-[13px] font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors px-3 py-2 rounded-lg hover:bg-black/[0.03]"
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
    </motion.nav>
  );
}
