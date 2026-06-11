'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Share2, MapPin, Eye, ShoppingCart, Sparkles, Clock } from 'lucide-react'
import { markStoreShared } from '@/actions/missions'

interface TrialWinTrackerProps {
  step1Done: boolean // tenant_missions.step_1_business (Store generated)
  step2Done: boolean // productCount > 0 (First product added)
  step3Done: boolean // upi or rzp configured (Payment method configured)
  step4Done: boolean // tenant_missions.step_5_shared (Store link copied/shared)
  step5Done: boolean // visitorCount > 0 (First real visitor)
  trialExpiresAt: string
  tenantId: string
  todayViews: number
  todayProductViews: number
  todayCartAdds: number
  subdomain: string
}

export function TrialWinTracker({
  step1Done,
  step2Done,
  step3Done,
  step4Done,
  step5Done: initialStep5Done,
  trialExpiresAt,
  tenantId,
  todayViews,
  todayProductViews,
  todayCartAdds,
  subdomain,
}: TrialWinTrackerProps) {
  const [copied, setCopied] = useState(false)
  const [localStep4Done, setLocalStep4Done] = useState(step4Done)
  const [timeLeftStr, setTimeLeftStr] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  // Trigger confetti if milestone 5 gets completed
  useEffect(() => {
    if (initialStep5Done) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 6000)
      return () => clearTimeout(timer)
    }
  }, [initialStep5Done])

  // Live timer for trial expiration
  useEffect(() => {
    const updateTimer = () => {
      const diffMs = new Date(trialExpiresAt).getTime() - Date.now()
      if (diffMs <= 0) {
        setTimeLeftStr('Expired')
        return
      }
      const hours = Math.floor(diffMs / (3600 * 1000))
      const minutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000))
      setTimeLeftStr(`${hours}h ${minutes}m`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000)
    return () => clearInterval(interval)
  }, [trialExpiresAt])

  const milestones = [
    { id: 1, label: 'Store Generated', done: step1Done },
    { id: 2, label: 'Add First Product', done: step2Done },
    { id: 3, label: 'Configure Payments', done: step3Done },
    { id: 4, label: 'Share Store Link', done: localStep4Done },
    { id: 5, label: 'Get First Visitor', done: initialStep5Done },
  ]

  const completedCount = milestones.filter((m) => m.done).map((m) => m.id).length
  const progressPercent = (completedCount / 5) * 100

  const handleShare = async () => {
    const shareUrl = `https://${subdomain}.launchgrid.in`
    const whatsappText = encodeURIComponent(`Check out my new store! ${shareUrl}`)
    
    // Open WhatsApp
    window.open(`https://api.whatsapp.com/send?text=${whatsappText}`, '_blank')

    // Mark as shared in DB
    try {
      setLocalStep4Done(true)
      await markStoreShared(tenantId)
    } catch (err) {
      console.error('Failed to mark store as shared:', err)
    }
  }

  const handleCopy = () => {
    const shareUrl = `https://${subdomain}.launchgrid.in`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    
    // Mark as shared in DB since copy counts as sharing/intent to share
    if (!localStep4Done) {
      setLocalStep4Done(true)
      markStoreShared(tenantId).catch(console.error)
    }
  }

  return (
    <div className="relative overflow-hidden bg-zinc-950 text-zinc-100 rounded-3xl border border-zinc-800 shadow-2xl p-6 md:p-8 mb-8 font-inter">
      {/* Top Progress Bar - Green to Amber gradient */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500"
        />
      </div>

      {/* Confetti Animation Layer */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, times: [0, 0.7, 1] }}
              className="flex items-center justify-center gap-2"
            >
              <Sparkles className="w-12 h-12 text-emerald-400 animate-spin" />
              <div className="text-xl font-bold text-emerald-400 font-playfair tracking-wide">
                First Visitor Achieved! 🚀
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free Trial Mode
            </span>
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              Trial ends in: <strong className="text-amber-400">{timeLeftStr}</strong>
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-playfair tracking-tight text-white">
            Unlock your first visitor today
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Follow the checklist to configure your store, launch it to the public discover feed, and get your very first customer visitor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 self-start md:self-center">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-md active:scale-95 whitespace-nowrap"
          >
            <Share2 className="w-4 h-4" /> Share on WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all active:scale-95 whitespace-nowrap"
          >
            {copied ? 'Copied!' : 'Copy Store Link'}
          </button>
        </div>
      </div>

      {/* 5 Milestone Circles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 md:gap-6 pt-2 pb-6 border-b border-zinc-800/80">
        {milestones.map((m, idx) => {
          const isActive = !m.done && (idx === 0 || milestones[idx - 1].done)
          return (
            <div key={m.id} className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                {m.done ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Check className="w-5 h-5 text-zinc-950 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-teal-500 flex items-center justify-center relative">
                    <span className="w-3.5 h-3.5 rounded-full bg-teal-400 animate-ping absolute" />
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 z-10" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-xs">
                    {m.id}
                  </div>
                )}
              </div>
              <span className={`text-xs font-semibold ${m.done ? 'text-zinc-200' : isActive ? 'text-teal-400' : 'text-zinc-500'}`}>
                {m.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Today's Activity Tracker Row (System 4) */}
      <div className="pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3.5">
          Today's Live Store Activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 px-4 py-3 rounded-2xl">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Live Store Visitors</div>
              <div className="text-lg font-bold text-white tracking-tight">{todayViews}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 px-4 py-3 rounded-2xl">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/15">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Product Views</div>
              <div className="text-lg font-bold text-white tracking-tight">{todayProductViews}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800/50 px-4 py-3 rounded-2xl">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/15">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Adds to Cart</div>
              <div className="text-lg font-bold text-white tracking-tight">{todayCartAdds}</div>
            </div>
          </div>
        </div>

        {initialStep5Done && (
          <div className="mt-4 p-3 bg-emerald-950/20 border border-emerald-800/20 text-emerald-400 text-xs font-medium rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Real visitor detected! Your marketing links are working. Keep sharing to get your first order!</span>
          </div>
        )}
      </div>
    </div>
  )
}
