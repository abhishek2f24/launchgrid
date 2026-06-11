'use client';

import Link from 'next/link';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S10_FinalCTA() {
  return (
    <section className="py-24 w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <SectionReveal className="flex flex-col items-center gap-6">
          {/* Close the narrative loop: resolve the hero's opening line */}
          <h2 className="font-playfair text-3xl md:text-4xl font-bold text-[var(--color-mark-ink)] leading-tight">
            Still thinking about it?
          </h2>
          <p className="font-playfair italic text-[var(--color-mark-secondary)] text-lg -mt-2">
            You&apos;re 15 minutes away from done thinking.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/onboarding"
              className="bg-[var(--color-mark-ink)] text-white font-inter text-sm font-bold py-4 px-10 rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98]"
            >
              Start building my store →
            </Link>
            <Link
              href="/login"
              className="font-inter text-sm font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
            >
              Already have an account? Login
            </Link>
          </div>
          <div className="flex items-center gap-6 text-xs text-[var(--color-mark-secondary)] mt-2 opacity-80">
            <span>No credit card required</span>
            <span>·</span>
            <span>Store live in minutes</span>
            <span>·</span>
            <span>Cancel anytime</span>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
