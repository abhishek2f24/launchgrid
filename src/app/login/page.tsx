'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const nextRoute = searchParams?.get('next');
    const extId = searchParams?.get('ext_id');
    
    if (nextRoute) {
      let target = nextRoute;
      if (extId) {
        target += `?ext_id=${extId}`;
      }
      router.push(target);
    } else {
      router.push('/dashboard');
    }
    router.refresh();
  };

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-mark-ink)] opacity-[0.02] blur-[100px] rounded-full pointer-events-none" />

      <nav className="fixed top-0 left-0 w-full p-6 lg:px-12 z-50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] flex items-center justify-center font-inter font-bold text-xs shadow-md transition-transform group-hover:scale-105">
            LG
          </div>
          <span className="font-inter font-bold text-lg tracking-tight text-[var(--color-mark-ink)]">
            LaunchGrid
          </span>
        </Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 mt-16 md:mt-0">
        <motion.div 
          className="w-full max-w-sm bg-white/80 backdrop-blur-xl p-10 rounded-[2rem] border border-black/5 shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="text-center mb-8">
            <h1 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">Welcome back.</h1>
            <p className="font-inter text-sm text-[var(--color-mark-secondary)]/80">
              Access your dashboard to manage your store.
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 text-red-600 font-inter text-xs p-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5 relative">
              <label htmlFor="email" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">Email Address</label>
              <input 
                id="email" 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="founder@example.com"
                className="px-4 py-3.5 rounded-xl border border-black/10 bg-white font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5 relative">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="font-inter text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">Password</label>
                <a href="/forgot-password" className="font-inter text-xs text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">Forgot?</a>
              </div>
              <input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3.5 rounded-xl border border-black/10 bg-white font-inter text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[var(--color-mark-ink)] text-white font-inter text-sm font-bold py-4 rounded-xl hover:bg-black/90 active:scale-[0.98] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
              {!loading && (
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-black/5 pt-6">
            <span className="font-inter text-sm text-[var(--color-mark-secondary)]">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[var(--color-mark-ink)] font-bold hover:underline decoration-2 underline-offset-4">
                Sign up
              </Link>
            </span>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-mark-base)] flex items-center justify-center font-inter text-xs font-bold text-[var(--color-mark-secondary)]">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
