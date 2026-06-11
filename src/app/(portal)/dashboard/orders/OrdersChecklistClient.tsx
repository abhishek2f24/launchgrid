'use client'

import { useState } from 'react'
import { CheckCircle2, AlertCircle, Lock, ExternalLink, Copy, ShoppingBag, CreditCard, Puzzle, Share2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  hasPayments: boolean
  hasProducts: boolean
  productCount: number
  storeUrl: string
}

export function OrdersChecklistClient({ hasPayments, hasProducts, productCount, storeUrl }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine current active step
  let activeStep = 1
  if (hasPayments) {
    if (hasProducts) {
      activeStep = 3
    } else {
      activeStep = 2
    }
  } else {
    activeStep = 1
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 font-inter">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[2rem] p-8 shadow-sm">
        <div className="space-y-3 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-purple-950">Awaiting your first order.</h2>
          <p className="text-xs text-purple-800/80 font-medium leading-relaxed">
            Your store is live, but you don't have any orders yet. Follow this curated pathway to complete your setup, verify checkout, and get your first customer!
          </p>
        </div>
      </div>

      {/* Guided checklist */}
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-8">
        <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] border-b border-black/5 pb-4">
          Store Launch Pathway
        </h3>

        <div className="space-y-6">
          {/* STEP 1: Payments */}
          <div className={`flex gap-4 items-start p-5 rounded-2xl border transition-all ${
            hasPayments ? 'bg-green-50/50 border-green-100' : 'bg-white border-black/5 shadow-sm ring-1 ring-[var(--color-mark-ink)]/5'
          }`}>
            <div className="shrink-0 mt-0.5">
              {hasPayments ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Connect Payment Configuration</h4>
                {hasPayments && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Completed</span>}
              </div>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Set up your UPI ID or connect Razorpay keys so customers can checkout successfully.
              </p>
              {!hasPayments && (
                <div className="pt-2">
                  <Link href="/dashboard/settings/payments" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 transition-all shadow-md">
                    <CreditCard className="w-3.5 h-3.5" /> Setup Payments →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Products */}
          <div className={`flex gap-4 items-start p-5 rounded-2xl border transition-all ${
            hasProducts ? 'bg-green-50/50 border-green-100' : 
            activeStep === 2 ? 'bg-white border-black/5 shadow-sm ring-1 ring-[var(--color-mark-ink)]/5' : 'bg-black/[0.01] border-transparent opacity-60'
          }`}>
            <div className="shrink-0 mt-0.5">
              {hasProducts ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : activeStep < 2 ? (
                <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">2</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Add Products to Store</h4>
                {hasProducts && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Completed ({productCount} items)</span>}
              </div>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Add products manually or use the Chrome Extension to import dropship catalogs.
              </p>
              {!hasProducts && activeStep === 2 && (
                <div className="pt-2">
                  <Link href="/dashboard/products" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 transition-all shadow-md">
                    <Puzzle className="w-3.5 h-3.5" /> Import / Add Products →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Test checkout */}
          <div className={`flex gap-4 items-start p-5 rounded-2xl border transition-all ${
            activeStep === 3 ? 'bg-white border-black/5 shadow-sm ring-1 ring-[var(--color-mark-ink)]/5' : 'bg-black/[0.01] border-transparent opacity-60'
          }`}>
            <div className="shrink-0 mt-0.5">
              {activeStep < 3 ? (
                <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">3</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Verify Store Checkout (Test Order)</h4>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Visit your live storefront, add a product to the cart, and complete a test checkout. 
                This ensures your payment configuration is fully active.
              </p>
              {activeStep === 3 && (
                <div className="pt-2">
                  <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 transition-all shadow-md">
                    Open Storefront <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* STEP 4: Drive traffic */}
          <div className={`flex gap-4 items-start p-5 rounded-2xl border transition-all ${
            activeStep === 3 ? 'bg-white border-black/5 shadow-sm ring-1 ring-[var(--color-mark-ink)]/5' : 'bg-black/[0.01] border-transparent opacity-60'
          }`}>
            <div className="shrink-0 mt-0.5">
              {activeStep < 3 ? (
                <Lock className="w-5 h-5 text-slate-400 mt-0.5" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">4</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Share Store &amp; Drive Traffic</h4>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Copy your store link and share it on WhatsApp groups, Instagram bio, or Facebook groups.
              </p>
              {activeStep === 3 && (
                <div className="pt-3 space-y-3 max-w-md">
                  <div className="flex items-center gap-2 p-2.5 bg-black/[0.03] border border-black/5 rounded-xl">
                    <code className="text-xs font-bold text-[var(--color-mark-ink)] truncate flex-1">{storeUrl}</code>
                    <button 
                      onClick={handleCopy}
                      className="px-3 py-1.5 bg-white border border-black/10 hover:bg-black/5 rounded-lg text-[10px] font-bold text-[var(--color-mark-ink)] shrink-0 cursor-pointer shadow-sm"
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://api.whatsapp.com/send?text=Check%20out%20my%20new%20store%20live%20now!%20${encodeURIComponent(storeUrl)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
