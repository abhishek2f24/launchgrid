'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, AlertTriangle } from 'lucide-react'

export function TrialExpiryModal({ trialMsLeft, onUpgrade }: { trialMsLeft: number; onUpgrade: () => void }) {
  const [dismissed, setDismissed] = useState(true) // default true to avoid SSR layout shift

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissedAt = localStorage.getItem('lg_trial_warn_dismissed')
      if (dismissedAt) {
        const age = Date.now() - parseInt(dismissedAt, 10)
        if (age < 3600 * 1000) {
          // Dismissed less than 1 hour ago, keep hidden
          setDismissed(true)
          return
        }
      }
      setDismissed(false)
    }
  }, [])

  const showModal = trialMsLeft < 3600000 && trialMsLeft > 0 && !dismissed

  const minutesLeft = Math.floor(trialMsLeft / 60000)

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('lg_trial_warn_dismissed', Date.now().toString())
    }
  }

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-inter"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="bg-white rounded-[2rem] p-10 max-w-md w-full text-center shadow-2xl relative border border-zinc-100 overflow-hidden"
          >
            {/* Top red glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>

            <h2 className="font-playfair text-2xl font-bold text-zinc-900 mb-3">
              {minutesLeft} minutes left.
            </h2>
            <p className="font-inter text-zinc-500 text-sm leading-relaxed mb-8">
              Your store and everything you built will be archived in {minutesLeft} minutes. 
              Upgrade now to keep your store live — your products, your orders, your domain.
            </p>

            <div className="space-y-3">
              <button
                onClick={onUpgrade}
                className="w-full bg-zinc-950 text-white font-inter font-bold py-4 rounded-xl text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Keep My Store Live →
              </button>
              <button
                onClick={handleDismiss}
                className="text-xs text-zinc-400 hover:text-zinc-600 font-medium py-2 transition-colors"
              >
                I understand, I'll lose everything
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
