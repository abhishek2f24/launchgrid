'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  // The reset email link signs the user in via the URL (handled by supabase-js).
  // Verify a session exists before showing the form.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionReady(!!session)
    })
    // Also listen — token exchange can complete just after mount
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSessionReady(true)
    })
    return () => sub.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] flex items-center justify-center px-6 font-inter">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-[2rem] p-8 md:p-10 shadow-sm">
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Password updated</h1>
            <p className="text-sm text-[var(--color-mark-secondary)]">Taking you to your dashboard…</p>
          </div>
        ) : sessionReady === false ? (
          <div className="text-center space-y-4">
            <h1 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Link expired</h1>
            <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              This reset link is invalid or has expired. Request a fresh one — it takes 10 seconds.
            </p>
            <Link href="/forgot-password" className="inline-block px-5 py-3 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold hover:bg-black transition-all">
              Request new link
            </Link>
          </div>
        ) : sessionReady === null ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--color-mark-secondary)]" />
          </div>
        ) : (
          <>
            <h1 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-2">Choose a new password</h1>
            <p className="text-sm text-[var(--color-mark-secondary)] mb-6">At least 8 characters. You&apos;ll be logged in right after.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">New Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="px-4 py-3.5 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="confirm" className="text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">Confirm Password</label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="px-4 py-3.5 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : 'Update password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
