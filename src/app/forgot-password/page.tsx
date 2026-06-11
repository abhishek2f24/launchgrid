'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] flex items-center justify-center px-6 font-inter">
      <div className="w-full max-w-md bg-white border border-black/10 rounded-[2rem] p-8 md:p-10 shadow-sm">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto">
              <MailCheck className="w-6 h-6 text-green-600" />
            </div>
            <h1 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">Check your email</h1>
            <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed">
              If an account exists for <span className="font-bold text-[var(--color-mark-ink)]">{email}</span>,
              we&apos;ve sent a link to reset your password. The link expires in 1 hour.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-mark-ink)] hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-2">Reset your password</h1>
            <p className="text-sm text-[var(--color-mark-secondary)] mb-6">
              Enter the email you signed up with and we&apos;ll send you a reset link.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-bold tracking-widest uppercase text-[var(--color-mark-secondary)]/60">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="founder@example.com"
                  className="px-4 py-3.5 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send reset link'}
              </button>
            </form>
            <Link href="/login" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
