'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { platformEvent, trackLead } from '@/lib/pixel';

export function SignupForm() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const router      = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from URL ?ref= but allow manual edit
  const urlRef = searchParams.get('ref') || '';
  const [refCode, setRefCode] = useState(urlRef);

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedRef = refCode.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          referral_code: trimmedRef || undefined,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Record referral attribution
    if (trimmedRef && data.user) {
      fetch('/api/referrals/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refCode: trimmedRef, newUserId: data.user.id }),
      }).catch(() => {}); // fire-and-forget
    }

    // Conversion event → GTM dataLayer (wire Google Ads / Meta tags in GTM)
    platformEvent('sign_up', { method: 'email', referred: !!trimmedRef });
    trackLead();

    if (data.session) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError('Check your email to verify your account.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-sm bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-black/5 shadow-2xl relative"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Referral badge — shown when code pre-filled from URL */}
      {urlRef && (
        <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs font-bold text-green-700 text-center">
          🎁 You were referred by <span className="font-extrabold">{urlRef}</span>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">Start your journey.</h1>
        <p className="font-inter text-sm text-[var(--color-mark-secondary)]/80">
          No code. No inventory. Just growth.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSignup}>
        {error && (
          <div className="bg-red-50 text-red-600 font-inter text-xs p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">
            Full Name
          </label>
          <input
            id="name" type="text" required
            value={name} onChange={e => setName(e.target.value)}
            placeholder="Steve Jobs"
            className="px-4 py-3.5 rounded-xl border border-black/10 bg-white font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">
            Email Address
          </label>
          <input
            id="email" type="email" required
            value={email} onChange={e => setEmail(e.target.value)}
            placeholder="founder@example.com"
            className="px-4 py-3.5 rounded-xl border border-black/10 bg-white font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">
            Create Password
          </label>
          <input
            id="password" type="password" required
            value={password} onChange={e => setPassword(e.target.value)}
            className="px-4 py-3.5 rounded-xl border border-black/10 bg-white font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
          />
        </div>

        {/* Referral Code */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="refCode" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60 flex items-center justify-between">
            Referral Code
            <span className="normal-case text-xs font-semibold text-[var(--color-mark-secondary)]/50">Optional</span>
          </label>
          <div className="relative">
            <input
              id="refCode" type="text"
              value={refCode} onChange={e => setRefCode(e.target.value)}
              placeholder="e.g. mystore"
              className={`w-full px-4 py-3.5 rounded-xl border font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:ring-1 transition-all shadow-sm
                ${refCode
                  ? 'border-green-300 bg-green-50/50 focus:border-green-500 focus:ring-green-200'
                  : 'border-black/10 bg-white focus:border-[var(--color-mark-ink)] focus:ring-[var(--color-mark-ink)]'
                }`}
            />
            {refCode && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 text-xs font-bold">✓</span>
            )}
          </div>
        </div>

        {/* Consent */}
        <div className="flex items-start gap-2.5 mt-2">
          <input
            type="checkbox" id="consent" required
            className="mt-1 w-4 h-4 rounded border-black/20 text-[var(--color-mark-ink)] focus:ring-[var(--color-mark-ink)]"
          />
          <label htmlFor="consent" className="font-inter text-xs text-[var(--color-mark-secondary)] leading-relaxed">
            I agree to the{' '}
            <Link href="/legal/terms" className="underline hover:text-[var(--color-mark-ink)]">Terms</Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="underline hover:text-[var(--color-mark-ink)]">Privacy Policy</Link>.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full bg-[var(--color-mark-ink)] text-white font-inter text-sm font-bold py-4 rounded-xl hover:bg-black/90 active:scale-[0.98] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          {loading ? 'Creating Store...' : 'Create My Store'}
          {!loading && (
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-black/5 pt-6">
        <span className="font-inter text-sm text-[var(--color-mark-secondary)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-mark-ink)] font-bold hover:underline decoration-2 underline-offset-4">
            Sign in
          </Link>
        </span>
      </div>
    </motion.div>
  );
}
