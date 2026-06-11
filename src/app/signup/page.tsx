import { Suspense } from 'react';
import Link from 'next/link';
import { SignupForm } from '@/components/signup-journey/SignupForm';
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay';

export default function SignupJourneyPage() {
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)] overflow-hidden">
      <GrainOverlay />
      
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-mark-ink)] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full p-6 lg:px-12 z-50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group outline-none">
          <div className="w-8 h-8 rounded bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] flex items-center justify-center font-inter font-bold text-xs shadow-md transition-transform group-hover:scale-105">
            LG
          </div>
          <span className="font-playfair font-bold tracking-widest text-[11px] uppercase text-[var(--color-mark-ink)]">
            LaunchGrid
          </span>
        </Link>
        <Link
          href="/login"
          className="font-inter text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors"
        >
          Login →
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 mt-16 md:mt-0">
        <Suspense fallback={<div className="h-[400px] w-full max-w-sm mx-auto animate-pulse bg-[var(--color-mark-muted)] rounded-2xl" />}>
          <SignupForm />
        </Suspense>
      </main>
    </div>
  );
}
