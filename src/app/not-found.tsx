import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found — LaunchGrid',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--color-mark-base)] flex flex-col items-center justify-center px-6 font-inter">
      <div className="text-center max-w-md">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-mark-secondary)] mb-6 font-bold">404</p>
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-[var(--color-mark-ink)] mb-4 leading-tight">
          This page doesn't exist.
        </h1>
        <p className="text-[var(--color-mark-secondary)] text-sm leading-relaxed mb-10">
          The link you followed may be broken, or the page may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[var(--color-mark-ink)] text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/support"
            className="px-6 py-3 border border-[var(--color-mark-default)] text-[var(--color-mark-ink)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-mark-subtle)] transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </div>

      <p className="mt-16 text-[10px] text-[var(--color-mark-secondary)] uppercase tracking-[0.2em] font-bold">
        LaunchGrid — Your store, your brand.
      </p>
    </div>
  )
}
