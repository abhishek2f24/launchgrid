'use client';

import Link from 'next/link';
import { SectionReveal } from '../ui-landing/SectionReveal';

export default function S10_FinalCTA() {
  return (
    <section className="py-24 w-full bg-[var(--color-mark-subtle)] border-t border-[var(--color-mark-default)]">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <SectionReveal className="flex flex-col items-center gap-6">
          <p className="font-playfair italic text-[var(--color-mark-secondary)] text-lg">
            One year from now, you&apos;ll wish you started today.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="bg-[var(--color-mark-ink)] text-white font-inter text-sm font-bold py-4 px-10 rounded-full hover:bg-black/90 transition-all shadow-lg"
            >
              Start for Free →
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
