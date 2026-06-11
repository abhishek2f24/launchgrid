'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Sparkles, Zap, ShieldCheck } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  businessName: string
}

export function UpgradeModal({ isOpen, onClose, businessName }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter')

  const starterFeatures = [
    'Fully custom subdomain (name.launchgrid.in)',
    'Up to 100 active products',
    'WhatsApp chat checkout routing',
    'Standard analytics dashboard',
    'UPI payment routing (0% fees)',
    'Standard customer support',
  ]

  const proFeatures = [
    'Everything in Starter',
    'Unlimited active products',
    'Automated order processing',
    'Pro analytics & sales heatmaps',
    'Razorpay payment gateway routing',
    'GST invoices auto-generation',
    'Abandoned cart recovery automations',
    'Priority 1-on-1 support',
  ]

  // Prices must match the public /pricing page (single source of truth pending).
  const PLAN_DISPLAY: Record<'starter' | 'pro', { name: string; price: string }> = {
    starter: { name: 'Get Online (Starter)', price: '1,999' },
    pro: { name: 'Get Customers (Growth)', price: '9,999' },
  }

  const handleUpgrade = (plan: 'starter' | 'pro') => {
    const text = encodeURIComponent(
      `Hi! I want to upgrade my store "${businessName}" to the ${PLAN_DISPLAY[plan].name} plan (₹${PLAN_DISPLAY[plan].price}/month). Please activate my subscription.`
    )
    // Upgrade concierge number — MUST be set in env before launch.
    // Without it we fall back to the pricing page so the request is never lost.
    const waNumber = process.env.NEXT_PUBLIC_UPGRADE_WHATSAPP
    if (waNumber && /^\d{10,14}$/.test(waNumber)) {
      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank')
    } else {
      window.location.href = `/pricing?plan=${plan === 'pro' ? 'growth' : 'starter'}`
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-inter overflow-y-auto"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-white rounded-[2rem] p-8 md:p-10 max-w-4xl w-full shadow-2xl relative border border-zinc-100 my-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-100 transition-colors text-zinc-400 hover:text-zinc-650"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center max-w-md mx-auto mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/15 mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Premium Upgrade
              </span>
              <h2 className="font-playfair text-3xl font-bold text-zinc-900 tracking-tight">
                Choose the perfect plan for your store
              </h2>
              <p className="text-sm text-zinc-500 mt-2">
                Keep checkouts active and start generating sales. No setup fee. Cancel anytime.
              </p>
            </div>

            {/* Plan Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Starter Plan */}
              <div
                onClick={() => setSelectedPlan('starter')}
                className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlan === 'starter'
                    ? 'border-zinc-950 bg-zinc-50/20 shadow-md'
                    : 'border-zinc-200 hover:border-zinc-350 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900">Get Online</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Starter — best for new shops</p>
                    </div>
                    {selectedPlan === 'starter' && (
                      <span className="w-3 h-3 rounded-full bg-zinc-950 ring-4 ring-zinc-200" />
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-3xl font-extrabold text-zinc-900">₹1,999</span>
                    <span className="text-sm text-zinc-500">/ month</span>
                  </div>

                  <div className="space-y-3">
                    {starterFeatures.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-650 leading-normal">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpgrade('starter')
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedPlan === 'starter'
                        ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                        : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    Select Starter
                  </button>
                </div>
              </div>

              {/* Pro Plan */}
              <div
                onClick={() => setSelectedPlan('pro')}
                className={`relative rounded-3xl p-6 border-2 transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                  selectedPlan === 'pro'
                    ? 'border-indigo-650 bg-indigo-50/5 shadow-md'
                    : 'border-zinc-200 hover:border-zinc-350 bg-white'
                }`}
              >
                {/* Popular Badge */}
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] uppercase tracking-widest font-black py-1 px-4 rounded-bl-2xl">
                  Popular
                </div>

                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                        Get Customers <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Growth — scale your brand</p>
                    </div>
                    {selectedPlan === 'pro' && (
                      <span className="w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                    )}
                  </div>
                  
                  <div className="flex items-baseline gap-1.5 mb-6">
                    <span className="text-3xl font-extrabold text-zinc-900">₹9,999</span>
                    <span className="text-sm text-zinc-500">/ month</span>
                  </div>

                  <div className="space-y-3">
                    {proFeatures.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-650 leading-normal">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUpgrade('pro')
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedPlan === 'pro'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10'
                        : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
                    }`}
                  >
                    Select Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom trust footer */}
            <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Secure Checkout powered by Razorpay (WhatsApp direct onboarding fallback active)
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
