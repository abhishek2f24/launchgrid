'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const COOKIE_KEY = 'lg_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if user hasn't already responded
    try {
      const stored = localStorage.getItem(COOKIE_KEY)
      if (!stored) setVisible(true)
    } catch {
      // localStorage unavailable (SSR guard)
    }
  }, [])

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, 'accepted') } catch {}
    setVisible(false)
  }

  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, 'declined') } catch {}
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-[9999]"
        >
          <div className="bg-[var(--color-mark-surface)] border border-[var(--color-mark-default)] shadow-xl rounded-2xl p-5 font-inter">
            <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-4">
              We use essential cookies to keep your session working. No tracking or advertising cookies. Read our{' '}
              <a href="/legal/privacy" className="underline text-[var(--color-mark-ink)] font-medium">
                Privacy Policy
              </a>
              .
            </p>
            <div className="flex gap-2">
              <button
                onClick={accept}
                className="flex-1 py-2 bg-[var(--color-mark-ink)] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-black transition-colors rounded-lg"
              >
                Accept
              </button>
              <button
                onClick={decline}
                className="flex-1 py-2 border border-[var(--color-mark-default)] text-[var(--color-mark-secondary)] text-[11px] font-bold uppercase tracking-widest hover:bg-[var(--color-mark-subtle)] transition-colors rounded-lg"
              >
                Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
