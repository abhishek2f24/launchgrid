'use client'

import { useState, useEffect } from 'react'
import {
  ArrowUpRight, TrendingUp, DollarSign, ShoppingCart, Activity,
  Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, Sparkle,
  Lock, ExternalLink, ChevronRight, PackagePlus
} from 'lucide-react'
import { PanicStateModal } from '@/components/dashboard/PanicStateModal'
import { AnimatedCounter } from '@/components/animations/AnimatedCounter'
import { TrialWinTracker } from '@/components/dashboard/TrialWinTracker'
import { TrialExpiryModal } from '@/components/dashboard/TrialExpiryModal'
import { UpgradeModal } from '@/components/dashboard/UpgradeModal'
import { markStoreShared } from '@/actions/missions'

interface Props {
  tenant: any
  orders: any[]
  revenue: number
  productCount: number
  referralCount: number        // paid referrals
  referralPending?: number     // signups not yet paid
  referralCreditDays?: number  // accumulated free days from DB
  products?: any[]
  visitorCount?: number
  todayViews?: number
  todayProductViews?: number
  todayCartAdds?: number
  // All-time funnel counts from store_events
  allTimeProductViews?: number
  allTimeCartAdds?: number
  allTimeCheckoutStarts?: number
  // Real traffic source breakdown
  trafficSources?: Record<string, number>
  // Visits per utm_campaign (paid/organic campaign attribution)
  campaignStats?: Record<string, number>
}

// ─── Always-visible Action Banner ──────────────────────────────────────────
function ActionBanner({ productCount, plan, storeUrl, businessName, tenantId }: { productCount: number; plan: string; storeUrl: string; businessName: string; tenantId: string }) {
  if (productCount === 0) {
    return (
      <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center shrink-0 shadow-md">
            <PackagePlus className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h4 className="font-inter font-bold text-sm text-purple-900">Your store has no products yet</h4>
            <p className="font-inter text-xs text-purple-700/80 font-medium mt-0.5">
              Import from Meesho, Amazon, Ajio, or Nykaa in one click — or add your own inventory.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/dashboard/products"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-200 bg-white text-purple-700 hover:bg-purple-50 transition-colors shadow-sm"
          >
            Add Manually
          </a>
          <a
            href="/dashboard/products?tab=import"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            Import Products →
          </a>
        </div>
      </div>
    )
  }

  if ((plan !== 'pro' && plan !== 'premium')) {
    const shareMessage = `Hey! I just launched my new online store "${businessName}". Check out our catalog and order directly on our website: https://${storeUrl}`
    return (
      <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h4 className="font-inter font-bold text-sm text-amber-900">Next step: Drive traffic to your store</h4>
            <p className="font-inter text-xs text-amber-700/80 font-medium mt-0.5">
              Share your store link on WhatsApp, Instagram, and Facebook groups to get your first visitor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              markStoreShared(tenantId).catch(console.error)
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md shrink-0 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.49-5.114l.383.228c1.604.953 3.79 1.457 5.922 1.458 5.485 0 9.948-4.461 9.951-9.947.001-2.658-1.034-5.157-2.915-7.04C17.008 1.699 14.512.659 11.85.659 6.368.659 1.907 5.12 1.904 10.605c-.001 2.247.587 4.444 1.702 6.335l.26.442-1.0 3.652 3.74-.98L6.546 18.88zM17.43 14.39c-.312-.156-1.848-.912-2.131-1.016-.283-.105-.49-.156-.696.156-.206.312-.797.994-.976 1.196-.18.203-.36.228-.673.072-1.127-.565-1.928-1.004-2.686-2.302-.2-.34.2-.317.573-1.062.062-.125.031-.235-.016-.328-.047-.094-.49-1.182-.672-1.62-.177-.426-.356-.368-.49-.374-.127-.006-.273-.008-.42-.008-.147 0-.387.055-.589.273-.203.219-.773.755-.773 1.84 0 1.085.789 2.133.9 2.288.11.156 1.55 2.368 3.756 3.322 1.258.544 1.916.638 2.61.534.407-.061 1.22-.497 1.39-.98.17-.481.17-.894.12-.98-.05-.088-.184-.138-.496-.296z"/>
            </svg>
            Share Store
          </a>
          <a
            href={`https://${storeUrl}`}
            target="_blank"
            className="px-4 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-white text-amber-700 hover:bg-amber-50 transition-colors shadow-sm shrink-0"
          >
            View My Store →
          </a>
        </div>
      </div>
    )
  }

  return null
}

// ─── 12-Step Mission Definition ────────────────────────────────────────────
function getMissionSteps(tenant: any, orders: any[], productCount: number, plan: string) {
  const missions = tenant.tenant_missions?.[0] || {}
  return [
    { num: 1,  title: 'Reserve Subdomain',   outcome: 'Store URL live',            done: !!missions.step_1_business, locked: false, href: null },
    { num: 2,  title: 'Build Brand',          outcome: 'Professional from day one', done: !!missions.step_2_brand,    locked: false, href: null },
    { num: 3,  title: 'Import Catalog',       outcome: 'Store stocked',             done: productCount > 0,           locked: false, href: '/dashboard/products' },
    { num: 4,  title: 'Accept Payments',      outcome: 'Ready to get paid',         done: !!missions.step_4_payments, locked: false, href: '/dashboard/settings' },
    { num: 5,  title: 'Launch Store',         outcome: 'Live to customers',         done: !!missions.step_3_launch,   locked: false, href: null },
    { num: 6,  title: 'Drive First Traffic',  outcome: 'First visitor arrived',     done: orders.length > 0,         locked: false, href: null },
    { num: 7,  title: 'Get First Order',      outcome: 'Phone buzzed',              done: orders.length > 0,         locked: false, href: null },
    { num: 8,  title: 'Fulfill the Order',    outcome: 'Customer happy',            done: false,                     locked: (plan !== 'pro' && plan !== 'premium'), href: null },
    { num: 9,  title: 'Track Revenue',        outcome: 'Every rupee tracked',       done: false,                     locked: (plan !== 'pro' && plan !== 'premium'), href: null },
    { num: 10, title: 'Handle GST',           outcome: 'No penalties',              done: false,                     locked: (plan !== 'pro' && plan !== 'premium'), href: null },
    { num: 11, title: 'Scale With Ads',       outcome: 'Profitable growth begins',  done: false,                     locked: (plan !== 'pro' && plan !== 'premium'), href: null },
    { num: 12, title: 'Earn First Month',     outcome: '₹30K gross',               done: false,                     locked: (plan !== 'pro' && plan !== 'premium'), href: null },
  ]
}

// ─── Compliance Status (PRD §12B) ──────────────────────────────────────────
function getComplianceStatus(revenue: number, shippingScope: string | undefined, formatCurrency: (n: number) => string) {
  const isInterState = shippingScope === 'pan_india' || shippingScope === 'inter_state'

  if (isInterState && revenue > 0) {
    return {
      type: 'error',
      title: '🚨 Inter-State Sales: GST Required Immediately',
      desc: `Your store ships pan-India. Under GST law, inter-state sellers must register for GST regardless of revenue. Current turnover: ${formatCurrency(revenue)}.`,
      color: 'border-red-200 bg-red-50 text-red-800',
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    }
  }
  if (revenue >= 4000000) { // ₹40L
    return {
      type: 'error',
      title: '🚨 ₹40L Threshold Exceeded — Store Checkout Locked',
      desc: `Revenue ${formatCurrency(revenue)} exceeds the ₹40L intra-state goods GST limit. Checkout is disabled until a valid GSTIN is verified in your account.`,
      color: 'border-red-200 bg-red-50 text-red-800',
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    }
  }
  if (revenue >= 3500000) { // ₹35L — approaching ₹40L
    return {
      type: 'warning',
      title: '⚠️ Approaching ₹40L GST Threshold',
      desc: `Revenue at ${formatCurrency(revenue)} — ${formatCurrency(4000000 - revenue)} away from mandatory GST registration. Register now to avoid checkout lockout.`,
      color: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />,
    }
  }
  if (revenue >= 2000000) { // ₹20L — service hard limit
    return {
      type: 'error',
      title: '🚨 ₹20L Service Limit — Action Required',
      desc: `Revenue ${formatCurrency(revenue)} has crossed the ₹20L service-sector GST threshold. Register for GST and submit your GSTIN to keep checkout active.`,
      color: 'border-red-200 bg-red-50 text-red-800',
      icon: <ShieldAlert className="w-5 h-5 text-red-600" />,
    }
  }
  if (revenue >= 1500000) { // ₹15L — service warning
    return {
      type: 'warning',
      title: '⚠️ ₹15L Reached — Start GST Registration',
      desc: `Revenue ${formatCurrency(revenue)} is approaching the ₹20L service-sector limit. Begin your GST registration now — it takes 3–7 working days.`,
      color: 'border-amber-200 bg-amber-50 text-amber-800',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 animate-pulse" />,
    }
  }
  if (revenue >= 100000) { // ₹1L — Razorpay nudge
    return {
      type: 'info',
      title: '💡 ₹1L Milestone — Upgrade to Razorpay',
      desc: `Congrats on ${formatCurrency(revenue)} in revenue! Switch to Razorpay BYOK now to access UPI Autopay, EMI, and net banking — and reduce your platform fee to 5%.`,
      color: 'border-blue-200 bg-blue-50 text-blue-800',
      icon: <Sparkles className="w-5 h-5 text-blue-600" />,
    }
  }
  return {
    type: 'success',
    title: '✅ Compliance Status: Active',
    desc: `Revenue ${formatCurrency(revenue)} is well under all GST thresholds. No action needed — keep selling!`,
    color: 'border-green-200 bg-green-50 text-green-800',
    icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
  }
}

// ─── Merchant Success Score ─────────────────────────────────────────────────
// One card, one number, one next action. Replaces the banner/win-card pile-up.
function SuccessScoreCard({
  productCount, paymentReady, shared, visitors, cartAdds, orderCount,
  storeUrl, businessName, tenantId,
}: {
  productCount: number; paymentReady: boolean; shared: boolean;
  visitors: number; cartAdds: number; orderCount: number;
  storeUrl: string; businessName: string; tenantId: string;
}) {
  const shareMessage = `Hey! I just launched my new online store "${businessName}". Check out our catalog and order directly on our website: https://${storeUrl}`
  const shareHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`

  // Each milestone: honest directional impact (never invented statistics) + real time cost
  const items = [
    { label: 'Store live', pts: 10, earned: 10, done: true, hint: 'Your store URL is active', impact: '', time: '' },
    { label: 'Add 3+ products', pts: 15, earned: productCount >= 3 ? 15 : productCount > 0 ? 7 : 0, done: productCount >= 3, hint: productCount > 0 ? `${productCount} added — aim for 3+` : 'Stores under 3 products rarely convert', href: '/dashboard/products/add', cta: 'Add a product', impact: 'A stocked store gets taken seriously by buyers', time: '2 min per product — paste any Meesho/Amazon link' },
    { label: 'Connect payments', pts: 15, earned: paymentReady ? 15 : 0, done: paymentReady, hint: 'UPI or Razorpay — get paid from order one', href: '/dashboard/settings/payments', cta: 'Connect payments', impact: 'Customers can pay the moment they want to buy', time: '3 minutes' },
    { label: 'Share your store', pts: 15, earned: shared ? 15 : 0, done: shared, hint: 'The #1 predictor of a first sale', share: true, cta: 'Share on WhatsApp', impact: 'Your first visitors come from people you know', time: '30 seconds' },
    { label: 'First 10 visitors', pts: 10, earned: visitors >= 10 ? 10 : 0, done: visitors >= 10, hint: visitors > 0 ? `${visitors} so far — keep sharing` : 'Share in 2 groups + Instagram bio', share: true, cta: 'Share again', impact: 'No visitors, no sales — traffic comes first', time: '5 minutes of sharing' },
    { label: 'First cart add', pts: 5, earned: cartAdds > 0 ? 5 : 0, done: cartAdds > 0, hint: 'Someone wants what you sell', impact: '', time: '' },
    { label: 'First order', pts: 30, earned: orderCount > 0 ? 30 : 0, done: orderCount > 0, hint: 'The moment it becomes a business', impact: '', time: '' },
  ]

  const score = items.reduce((s, i) => s + i.earned, 0)
  const band = score >= 86 ? 'Growing' : score >= 66 ? 'Selling' : score >= 36 ? 'Ready to sell' : 'Setting up'
  const next = items.find(i => !i.done)

  // SVG ring geometry
  const R = 34
  const CIRC = 2 * Math.PI * R

  return (
    <div className="bg-white border border-black/5 rounded-[2rem] p-6 md:p-8 shadow-sm relative z-10 font-inter">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        {/* Score ring */}
        <div className="flex items-center gap-5 shrink-0">
          <div className="relative w-24 h-24">
            <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
              <circle cx="40" cy="40" r={R} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
              <circle
                cx="40" cy="40" r={R} fill="none"
                stroke={score >= 66 ? '#16a34a' : 'var(--color-mark-ink, #1A1A18)'}
                strokeWidth="7" strokeLinecap="round"
                strokeDasharray={`${(score / 100) * CIRC} ${CIRC}`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-[var(--color-mark-ink)] font-playfair leading-none">{score}</span>
              <span className="text-[11px] font-bold text-[var(--color-mark-secondary)]">/ 100</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]">Success Score</p>
            <p className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">{band}</p>
            {next ? (
              <div className="mt-2 max-w-[260px] space-y-1">
                <p className="text-xs font-medium text-[var(--color-mark-secondary)]">
                  Next highest-impact action: <span className="font-bold text-[var(--color-mark-ink)]">{next.label}</span> (+{next.pts} pts)
                </p>
                {next.impact && (
                  <p className="text-xs font-medium text-[var(--color-mark-secondary)]">{next.impact}.</p>
                )}
                {next.time && (
                  <p className="text-xs font-bold text-[var(--color-mark-ink)]">Time required: {next.time}</p>
                )}
              </div>
            ) : (
              <p className="text-xs font-medium text-green-700 mt-1">All milestones complete — time to scale.</p>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
          {items.map(item => (
            <div key={item.label} className="flex items-start gap-2.5">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${item === next ? 'border-[var(--color-mark-ink)]' : 'border-black/15'}`} />
              )}
              <div className="min-w-0">
                <p className={`text-sm leading-tight ${item.done ? 'text-[var(--color-mark-secondary)] line-through decoration-black/20' : item === next ? 'font-bold text-[var(--color-mark-ink)]' : 'font-medium text-[var(--color-mark-ink)]'}`}>
                  {item.label}
                </p>
                {!item.done && item === next && (
                  <p className="text-xs text-[var(--color-mark-secondary)] font-medium mt-0.5">{item.hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* One primary CTA */}
        {next && (next.href || next.share) && (
          <div className="shrink-0">
            {next.share ? (
              <a
                href={shareHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { markStoreShared(tenantId).catch(console.error) }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md active:scale-95"
              >
                {next.cta} <ArrowUpRight className="w-4 h-4" />
              </a>
            ) : (
              <a
                href={next.href!}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--color-mark-ink)] text-white font-bold text-sm hover:bg-black/90 transition-all shadow-md active:scale-95"
              >
                {next.cta} <ArrowUpRight className="w-4 h-4" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step Card ─────────────────────────────────────────────────────────────
function StepCard({ step, isActive }: { step: ReturnType<typeof getMissionSteps>[number], isActive: boolean }) {
  const content = (
    <div
      className={`relative p-4 rounded-2xl border flex flex-col gap-1.5 transition-all duration-200 min-h-[100px]
        ${step.done
          ? 'border-green-200 bg-green-50'
          : step.locked
          ? 'border-black/5 bg-black/[0.02] opacity-60'
          : isActive
          ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-ink)] text-white shadow-lg'
          : 'border-black/10 bg-white hover:shadow-sm'
        }`}
    >
      {step.locked && (
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/70 backdrop-blur-[2px] z-10">
          <Lock className="w-4 h-4 text-[var(--color-mark-secondary)]" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-widest
          ${step.done ? 'text-green-600' : step.locked ? 'text-slate-400' : isActive ? 'text-white/70' : 'text-slate-400'}`}>
          Step {step.num}
        </span>
        {step.done && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        {!step.done && isActive && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
        {!step.done && !isActive && !step.locked && step.href && (
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        )}
      </div>
      <p className={`font-bold text-sm leading-snug
        ${step.done ? 'text-green-900' : step.locked ? 'text-[var(--color-mark-secondary)]' : isActive ? 'text-white' : 'text-[var(--color-mark-ink)]'}`}>
        {step.title}
      </p>
      <p className={`text-[11px] font-medium leading-snug
        ${step.done ? 'text-green-700' : step.locked ? 'text-slate-400' : isActive ? 'text-white/70' : 'text-[var(--color-mark-secondary)]'}`}>
        {step.outcome}
      </p>
    </div>
  )

  if (step.href && !step.done && !step.locked) {
    return <a href={step.href}>{content}</a>
  }
  return content
}

// ─── Main Component ─────────────────────────────────────────────────────────
export function DashboardClient({
  tenant,
  orders,
  revenue,
  productCount,
  referralCount,
  referralPending = 0,
  referralCreditDays = 0,
  products = [],
  visitorCount = 0,
  todayViews = 0,
  todayProductViews = 0,
  todayCartAdds = 0,
  allTimeProductViews = 0,
  allTimeCartAdds = 0,
  allTimeCheckoutStarts = 0,
  trafficSources = {},
  campaignStats = {},
}: Props) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [unlockedStepAlert, setUnlockedStepAlert] = useState(false)

  // Force re-renders every 60s for live ticking countdown
  const [, forceUpdate] = useState(0)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lg_owner', 'true')
    }
    const interval = setInterval(() => forceUpdate(n => n + 1), 60000)
    return () => clearInterval(interval)
  }, [])

  const subRecord = tenant.subscriptions?.[0] || {}
  const plan = subRecord.plan_tier || 'free'
  const subStatus = subRecord.status || 'active'
  const currentPeriodEnd = subRecord.current_period_end

  const isTrial = subStatus === 'trialing'
  const trialMsLeft = currentPeriodEnd 
    ? Math.max(0, new Date(currentPeriodEnd).getTime() - Date.now())
    : 0
  const trialHoursLeft = Math.floor(trialMsLeft / (60 * 60 * 1000))
  const trialMinutesLeft = Math.floor((trialMsLeft % (60 * 60 * 1000)) / (60 * 1000))
  const isTrialExpired = isTrial && trialMsLeft <= 0
  const trialCountdown = trialHoursLeft > 0 
    ? `${trialHoursLeft}h ${trialMinutesLeft}m` 
    : `${trialMinutesLeft} minutes`

  const unfulfilledFirstOrder = orders.find(o => o.fulfillment_status === 'unfulfilled')
  const hasFirstOrder = !!unfulfilledFirstOrder
  const config = tenant.business_configs?.[0] || {}

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  // Real metrics only — no simulated fallbacks. Honest zeros build more trust
  // than impressive fakes, and merchants make real decisions from these numbers.
  const realVisitors = visitorCount
  const conversionRate = realVisitors > 0
    ? parseFloat(((orders.length / realVisitors) * 100).toFixed(2))
    : 0.0

  const compliance = getComplianceStatus(revenue, config.shipping_scope, formatCurrency)
  const missionSteps = getMissionSteps(tenant, orders, productCount, plan)
  const completedCount = missionSteps.filter(s => s.done).length
  const nextStep = missionSteps.find(s => !s.done && !s.locked)

  // ── Launch Readiness (mirrors SuccessScoreCard weights) → zone gating ──
  const paymentReady = !!(config.merchant_upi_id || config.rzp_key_id)
  const sharedOnce = !!tenant.tenant_missions?.[0]?.step_5_shared
  const launchScore =
    10 +
    (productCount >= 3 ? 15 : productCount > 0 ? 7 : 0) +
    (paymentReady ? 15 : 0) +
    (sharedOnce ? 15 : 0) +
    (realVisitors >= 10 ? 10 : 0) +
    (allTimeCartAdds > 0 ? 5 : 0) +
    (orders.length > 0 ? 30 : 0)
  // Focused mode: until the store is "Ready", analytics zones stay collapsed —
  // a wall of zeros overwhelms; one next action focuses.
  const focusedMode = launchScore < 36

  // ── Growth phase from real business data (MERCHANT_JOURNEY_DESIGN §6) ──
  const phase = revenue >= 100000
    ? { num: 4, label: 'Phase 4 · ₹1 Lakh+' }
    : revenue >= 10000
    ? { num: 3, label: 'Phase 3 · ₹10K+' }
    : orders.length > 0
    ? { num: 2, label: 'Phase 2 · Selling' }
    : { num: 1, label: 'Phase 1 · Launch' }

  // ── "Since you were here": today's real activity for the returning merchant ──
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0)
  const todayOrderCount = orders.filter(o => new Date(o.created_at) >= startOfToday).length

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 relative overflow-hidden min-h-screen pb-24">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-[var(--color-mark-ink)] mb-2">Overview.</h1>
          <p className="font-inter text-sm text-[var(--color-mark-secondary)]">
            {(todayViews > 0 || todayOrderCount > 0)
              ? <>Today so far: <span className="font-bold text-[var(--color-mark-ink)]">{todayViews} {todayViews === 1 ? 'visitor' : 'visitors'}</span>{todayOrderCount > 0 && <> · <span className="font-bold text-green-700">{todayOrderCount} {todayOrderCount === 1 ? 'order' : 'orders'}</span></>}</>
              : 'Track your store performance and next steps.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex px-4 py-2 rounded-xl border border-black/5 bg-white shadow-sm items-center gap-2">
            <span className="font-inter text-sm font-bold text-[var(--color-mark-ink)]">{phase.label}</span>
          </div>
          {productCount === 0 ? (
            <div className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 shadow-sm flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-inter text-sm font-bold text-amber-700">Store Empty</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl border border-black/5 bg-white shadow-sm flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="font-inter text-sm font-bold text-[var(--color-mark-ink)]">Store Live</span>
            </div>
          )}
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey! I just launched my new online store "${tenant.business_name}". Check out our catalog and order directly on our website: https://${tenant.subdomain}.launchgrid.in`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              markStoreShared(tenant.id).catch(console.error)
            }}
            className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-inter font-bold text-sm hover:bg-emerald-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.49-5.114l.383.228c1.604.953 3.79 1.457 5.922 1.458 5.485 0 9.948-4.461 9.951-9.947.001-2.658-1.034-5.157-2.915-7.04C17.008 1.699 14.512.659 11.85.659 6.368.659 1.907 5.12 1.904 10.605c-.001 2.247.587 4.444 1.702 6.335l.26.442-1.0 3.652 3.74-.98L6.546 18.88zM17.43 14.39c-.312-.156-1.848-.912-2.131-1.016-.283-.105-.49-.156-.696.156-.206.312-.797.994-.976 1.196-.18.203-.36.228-.673.072-1.127-.565-1.928-1.004-2.686-2.302-.2-.34.2-.317.573-1.062.062-.125.031-.235-.016-.328-.047-.094-.49-1.182-.672-1.62-.177-.426-.356-.368-.49-.374-.127-.006-.273-.008-.42-.008-.147 0-.387.055-.589.273-.203.219-.773.755-.773 1.84 0 1.085.789 2.133.9 2.288.11.156 1.55 2.368 3.756 3.322 1.258.544 1.916.638 2.61.534.407-.061 1.22-.497 1.39-.98.17-.481.17-.894.12-.98-.05-.088-.184-.138-.496-.296z"/>
            </svg>
            Share Store
          </a>
          <a
            href={`https://${tenant.subdomain}.launchgrid.in`}
            target="_blank"
            className="px-6 py-2 rounded-xl bg-[var(--color-mark-ink)] text-white font-inter font-bold text-sm hover:bg-black/90 transition-all shadow-md active:scale-95"
          >
            View Store
          </a>
        </div>
      </div>

      {/* ── MERCHANT SUCCESS SCORE — the one card that matters ── */}
      <SuccessScoreCard
        productCount={productCount}
        paymentReady={!!(config.merchant_upi_id || config.rzp_key_id)}
        shared={!!tenant.tenant_missions?.[0]?.step_5_shared}
        visitors={realVisitors}
        cartAdds={allTimeCartAdds}
        orderCount={orders.length}
        storeUrl={`${tenant.subdomain}.launchgrid.in`}
        businessName={tenant.business_name}
        tenantId={tenant.id}
      />

      {/* ── PANIC STATE MODAL ── */}
      {hasFirstOrder && <PanicStateModal order={unfulfilledFirstOrder} />}

      {/* ── UPGRADE ALERT ── */}
      {unlockedStepAlert && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-[1.5rem] flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <Sparkle className="w-5 h-5 text-green-600 animate-spin" />
            <div>
              <h4 className="font-inter font-bold text-sm text-green-900">Growth Plan Unlocked!</h4>
              <p className="font-inter text-xs text-green-800/80 font-medium">Steps 8–12 are now accessible on your First Sale Mission.</p>
            </div>
          </div>
          <button onClick={() => setUnlockedStepAlert(false)} className="text-xs text-green-900 underline hover:text-green-700 font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* ── TRIAL WIN TRACKER ── */}
      {isTrial && (
        <TrialWinTracker
          step1Done={!!tenant.tenant_missions?.[0]?.step_1_business}
          step2Done={productCount > 0}
          step3Done={!!(config.merchant_upi_id || config.rzp_key_id)}
          step4Done={!!tenant.tenant_missions?.[0]?.step_5_shared}
          step5Done={visitorCount > 0}
          trialExpiresAt={currentPeriodEnd}
          tenantId={tenant.id}
          todayViews={todayViews}
          todayProductViews={todayProductViews}
          todayCartAdds={todayCartAdds}
          subdomain={tenant.subdomain}
        />
      )}

      {/* ── TRIAL STATUS ALERT ── */}
      {isTrial && (
        <div className={`p-5 border rounded-[1.5rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative z-10 font-inter ${
          isTrialExpired 
            ? 'bg-red-50 border-red-200 text-red-900 animate-pulse' 
            : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              isTrialExpired ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {isTrialExpired ? 'Your Free Trial Has Expired' : `${trialCountdown} Left on Your Free Trial`}
              </h4>
              <p className="text-xs font-medium opacity-90 mt-0.5">
                {isTrialExpired 
                  ? 'Your storefront checkouts are temporarily disabled. Upgrade to a paid plan to instantly reactivate checkouts.'
                  : `You are on a 7-day free trial of LaunchGrid ${plan.toUpperCase()}. Upgrade anytime to keep checkout active after it ends.`
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 shrink-0 ${
              isTrialExpired 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* ── FIRST ORDER CELEBRATION UPSELL NUDGE (R-03) ── */}
      {orders.length > 0 && (plan !== 'pro' && plan !== 'premium') && (
        <div className="p-6 bg-gradient-to-r from-purple-900 to-indigo-950 border border-purple-500/30 rounded-[2rem] text-white shadow-xl relative overflow-hidden z-10 font-inter">
          {/* Decorative radial gradients */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5 animate-bounce" />
              </div>
              <h3 className="font-playfair text-2xl font-bold">🎉 You received your first order!</h3>
              <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                The emotional moment of your first sale is here. Ready to accept credit cards, net banking, and automate fulfillment to scale? Upgrade to <strong>Pro Plan</strong> now to lower transaction fees and grow faster.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-6 py-3 bg-white text-indigo-950 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-100 transition-all shadow-lg active:scale-95 shrink-0"
            >
              Upgrade to Pro Plan →
            </button>
          </div>
        </div>
      )}

      {/* ── FIRST SALE MISSION (12 STEPS) ── */}
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm relative z-10 font-inter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-black/5 pb-6">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-1">First Sale Mission</h2>
            <p className="text-[var(--color-mark-secondary)] text-sm">
              {nextStep ? `Next up: ${nextStep.title}` : 'All steps complete — you\'re a business owner!'}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-xs font-bold text-[var(--color-mark-secondary)]">
              <span className="text-2xl font-extrabold text-[var(--color-mark-ink)] font-playfair">{completedCount}</span>
              <span className="ml-1">/12 done</span>
            </div>
            <div className="w-px h-8 bg-black/10" />
            <span className="text-xs font-bold uppercase tracking-widest bg-black/5 px-3 py-1.5 rounded-xl text-[var(--color-mark-ink)] border border-black/5">
              {plan}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 h-1.5 bg-black/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-mark-ink)] rounded-full transition-all duration-700"
            style={{ width: `${(completedCount / 12) * 100}%` }}
          />
        </div>

        {/* Steps Grid: 4-col × 3 rows */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {missionSteps.map(step => (
            <StepCard
              key={step.num}
              step={step}
              isActive={!step.done && !step.locked && step === nextStep}
            />
          ))}
        </div>

        {/* Locked Steps CTA */}
        {(plan !== 'pro' && plan !== 'premium') && (
          <div className="mt-5 p-4 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[var(--color-mark-secondary)] shrink-0" />
              <p className="text-xs font-medium text-[var(--color-mark-secondary)]">
                <span className="font-bold text-[var(--color-mark-ink)]">Steps 8–12 require Pro or Premium.</span>{' '}
                Unlock advanced fulfillment tracking, GST tools, and ad campaign templates.
              </p>
            </div>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 shadow-md transition-transform hover:scale-105 shrink-0"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* ── METRICS + ANALYTICS — collapsed in focused mode until the store is Ready ── */}
      {focusedMode ? (
        <div className="bg-white/60 border border-dashed border-black/10 rounded-[2rem] p-6 text-center relative z-10 font-inter">
          <p className="text-sm font-semibold text-[var(--color-mark-ink)]">Revenue, visitors and insights will light up here as your store comes to life.</p>
          <p className="text-xs font-medium text-[var(--color-mark-secondary)] mt-1">Finish the next step above — everything unlocks automatically.</p>
        </div>
      ) : (
      <>
      {/* ── METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10 font-inter">
        {(() => {
          const now = new Date()
          const d7 = new Date(now); d7.setDate(now.getDate() - 7)
          const d30 = new Date(now); d30.setDate(now.getDate() - 30)
          const rev7 = orders.filter(o => new Date(o.created_at) >= d7).reduce((s, o) => s + Number(o.total_amount), 0)
          const rev30 = orders.filter(o => new Date(o.created_at) >= d30).reduce((s, o) => s + Number(o.total_amount), 0)
          const aov = orders.length > 0 ? Math.round(revenue / orders.length) : 0
          return (
            <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Total Revenue</h3>
                <DollarSign className="w-4.5 h-4.5 text-[var(--color-mark-ink)]" />
              </div>
              <div className="text-3xl font-extrabold text-[var(--color-mark-ink)] mb-2 font-playfair tracking-tight">
                <AnimatedCounter value={revenue} prefix="₹" />
              </div>
              <div className="flex flex-col gap-1 text-xs font-semibold text-[var(--color-mark-secondary)]">
                <span>7d: <span className="text-[var(--color-mark-ink)]">₹{rev7.toLocaleString('en-IN')}</span> · 30d: <span className="text-[var(--color-mark-ink)]">₹{rev30.toLocaleString('en-IN')}</span></span>
                {aov > 0 && <span>AOV: <span className="text-[var(--color-mark-ink)]">₹{aov.toLocaleString('en-IN')}</span></span>}
              </div>
            </div>
          )
        })()}

        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Orders</h3>
            <ShoppingCart className="w-4.5 h-4.5 text-[var(--color-mark-ink)]/60" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-mark-ink)] mb-2 font-playfair tracking-tight">
            <AnimatedCounter value={orders.length} />
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-[var(--color-mark-secondary)]">
            {orders.length > 0 ? 'Fulfillment healthy.' : 'No orders yet. Keep pushing!'}
          </div>
        </div>

        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Conversion Rate</h3>
            <TrendingUp className="w-4.5 h-4.5 text-[var(--color-mark-ink)]/60" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-mark-ink)] mb-2 font-playfair tracking-tight">
            <AnimatedCounter value={conversionRate} suffix="%" decimals={conversionRate > 0 ? 2 : 0} />
          </div>
          <div className="text-xs font-semibold text-[var(--color-mark-secondary)]">
            {realVisitors > 0 ? `From ${realVisitors.toLocaleString('en-IN')} visitors` : 'Awaiting first visitor'}
          </div>
        </div>

        <div className="bg-white border border-black/5 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Visitors Today</h3>
            <Activity className="w-4.5 h-4.5 text-[var(--color-mark-ink)]/60" />
          </div>
          <div className="text-3xl font-extrabold text-[var(--color-mark-ink)] mb-2 font-playfair tracking-tight">
            <AnimatedCounter value={todayViews} />
          </div>
          <div className="text-xs font-semibold text-[var(--color-mark-secondary)]">
            {todayViews > 0 ? `${todayProductViews} product views · ${todayCartAdds} cart adds` : 'Share your store to get eyes on it'}
          </div>
        </div>
      </div>

      {/* ── ANALYTICS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 font-inter">
        {/* Traffic Sources */}
        <div className="bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm space-y-6">
          <div>
            <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-1">Traffic Sources</h3>
            <p className="text-xs text-[var(--color-mark-secondary)]">Where your store visitors are coming from.</p>
          </div>
          <div className="space-y-4 pt-2">
            {(() => {
              const colorMap: Record<string, string> = {
                'Direct': 'bg-slate-900',
                'WhatsApp': 'bg-emerald-600',
                'Organic Search': 'bg-blue-600',
                'Social Media': 'bg-purple-600',
                'Paid Ads': 'bg-rose-600',
                'Referral': 'bg-amber-500',
              }
              const bucketOrder = ['Direct', 'WhatsApp', 'Organic Search', 'Social Media', 'Paid Ads', 'Referral']
              const total = Object.values(trafficSources).reduce((s, n) => s + n, 0)

              if (total === 0) {
                return (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-[var(--color-mark-ink)]">No visitors yet — let&apos;s fix that.</p>
                    <ul className="text-xs text-[var(--color-mark-secondary)] font-medium space-y-1.5 text-left max-w-[260px] mx-auto">
                      <li>1. Share your store link in 2 WhatsApp groups</li>
                      <li>2. Add the link to your Instagram bio</li>
                      <li>3. Post one product as a story today</li>
                    </ul>
                    <p className="text-xs text-[var(--color-mark-secondary)] font-medium pt-1">Sources will appear here as people visit.</p>
                  </div>
                )
              }

              const rows = bucketOrder
                .filter(b => (trafficSources[b] ?? 0) > 0)
                .map(b => ({
                  source: b,
                  count: trafficSources[b] ?? 0,
                  percentage: Math.round(((trafficSources[b] ?? 0) / total) * 100),
                  color: colorMap[b] ?? 'bg-slate-400',
                }))
                .sort((a, b) => b.count - a.count)

              return rows.map((item) => (
                <div key={item.source} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--color-mark-ink)]">{item.source}</span>
                    <span className="text-[var(--color-mark-secondary)]">{item.percentage}% ({item.count || 0})</span>
                  </div>
                  <div className="h-2 bg-black/[0.03] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))
            })()}
          </div>

          {/* Campaign performance (UTM) */}
          {Object.keys(campaignStats).length > 0 && (
            <div className="pt-4 border-t border-black/5">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-mark-secondary)] mb-3">Top Campaigns</p>
              <div className="space-y-2">
                {Object.entries(campaignStats)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([campaign, count]) => (
                    <div key={campaign} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[var(--color-mark-ink)] truncate pr-2" title={campaign}>{campaign}</span>
                      <span className="text-[var(--color-mark-secondary)] font-medium shrink-0">{count} visits</span>
                    </div>
                  ))}
              </div>
              <p className="text-[10px] text-[var(--color-mark-secondary)] mt-3 font-medium">
                Tag your ad links with <code className="bg-black/5 px-1 rounded">?utm_campaign=...</code> to see performance here.
              </p>
            </div>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm space-y-6">
          <div>
            <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-1">Conversion Funnel</h3>
            <p className="text-xs text-[var(--color-mark-secondary)]">Visitor journey to completed checkout.</p>
          </div>
          <div className="space-y-4 pt-2">
            {(() => {
              // Real funnel data only — zeros are honest and actionable
              const funnelVisitors = realVisitors
              const pct = (n: number) => funnelVisitors > 0 ? Math.round((n / funnelVisitors) * 100) : 0
              return [
                { step: '1. Store Visitors',      count: funnelVisitors,         percentage: funnelVisitors > 0 ? 100 : 0, label: 'All traffic' },
                { step: '2. Product Views',        count: allTimeProductViews,    percentage: pct(allTimeProductViews),    label: `${pct(allTimeProductViews)}% of visitors` },
                { step: '3. Cart Adds',            count: allTimeCartAdds,        percentage: pct(allTimeCartAdds),        label: `${pct(allTimeCartAdds)}% of visitors` },
                { step: '4. Checkout Initiated',   count: allTimeCheckoutStarts,  percentage: pct(allTimeCheckoutStarts),  label: `${pct(allTimeCheckoutStarts)}% of visitors` },
                { step: '5. Orders Placed',        count: orders.length,          percentage: pct(orders.length),          label: `${conversionRate}% conversion` },
              ]
            })().map((item, idx) => (
              <div key={item.step} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-black/5 text-[var(--color-mark-ink)] font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-bold text-[var(--color-mark-ink)]">
                    <span>{item.step.split('. ')[1]}</span>
                    <span>{item.count || 0}</span>
                  </div>
                  <div className="text-[10px] text-[var(--color-mark-secondary)] mt-0.5 font-medium">{item.label}</div>
                </div>
              </div>
            ))}
            </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-black/5 p-8 rounded-[2rem] shadow-sm space-y-6">
          <div>
            <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-1">Top Products</h3>
            <p className="text-xs text-[var(--color-mark-secondary)]">Best performing items in your catalog.</p>
          </div>
          <div className="space-y-3 pt-2">
            {products && products.length > 0 ? (
              products.slice(0, 3).map((p) => {
                // Real sales only — orders that actually contain this product
                const realSales = orders.filter(o => o.line_items?.some((li: any) => li.productId === p.id)).length
                const productRevenue = realSales * p.retail_price
                return (
                  <div key={p.id} className="flex items-center justify-between border-b border-black/5 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold text-[var(--color-mark-ink)] truncate">{p.title}</p>
                      <p className="text-[11px] text-[var(--color-mark-secondary)] font-medium mt-0.5">
                        {realSales > 0 ? `${realSales} ${realSales === 1 ? 'sale' : 'sales'}` : 'No sales yet'} · ₹{Number(p.retail_price).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-mark-ink)] whitespace-nowrap">
                      {realSales > 0 ? `₹${productRevenue.toLocaleString('en-IN')}` : '—'}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8">
                <PackagePlus className="w-8 h-8 text-[var(--color-mark-secondary)]/30 mx-auto mb-2" />
                <p className="text-xs text-[var(--color-mark-secondary)] font-medium">No products to display yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      {/* ── BOTTOM ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 font-inter">

        {/* Referral Widget */}
        <div className="bg-white border border-black/5 p-8 col-span-1 rounded-[2rem] shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)] mb-1">Unlock Free Days</h3>
            <p className="text-sm text-[var(--color-mark-secondary)] mb-6">
              Earn <span className="font-bold text-[var(--color-mark-ink)]">7 free days</span> of Premium for every founder who pays.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <div className="flex flex-col items-center p-3 bg-black/[0.02] rounded-xl border border-black/5">
                <span className="text-2xl font-extrabold font-playfair text-[var(--color-mark-ink)]">{referralCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 mt-0.5">Paid</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-black/[0.02] rounded-xl border border-black/5">
                <span className="text-2xl font-extrabold font-playfair text-[var(--color-mark-ink)]">{referralPending}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mt-0.5">Pending</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-green-50 rounded-xl border border-green-200">
                <span className="text-2xl font-extrabold font-playfair text-green-700">
                  {referralCreditDays > 0 ? referralCreditDays : referralCount * 7}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 mt-0.5">Days Free</span>
              </div>
            </div>

            {/* Credit breakdown */}
            {referralCount > 0 && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-[11px] font-semibold text-green-800 leading-relaxed">
                  {referralCreditDays > 0
                    ? `${referralCreditDays} free days credited to your subscription.`
                    : `${referralCount} paid referral${referralCount > 1 ? 's' : ''} × 7 days = ${referralCount * 7} days free when you subscribe.`
                  }
                </p>
              </div>
            )}

            {/* Referral link */}
            <div className="bg-black/5 border border-black/5 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/50 mb-2">Your referral link</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-xs text-[var(--color-mark-ink)] font-bold truncate">launchgrid.in/r/{tenant.subdomain}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://launchgrid.in/r/${tenant.subdomain}`)}
                  className="text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors bg-white px-2 py-1 rounded-lg border border-black/5 shadow-sm cursor-pointer shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h5 className="text-xs font-bold text-amber-900 mb-2">💡 Working Capital Warning</h5>
            <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
              Razorpay settles T+2 days. Keep at least ₹5,000 liquid to pay dropship suppliers before funds arrive.
            </p>
          </div>
        </div>

        {/* Compliance + AI Coach */}
        <div className="bg-white border border-black/5 p-8 col-span-2 rounded-[2rem] shadow-sm space-y-6 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-black/5 pb-6">
              <h3 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">AI Coach & Compliance</h3>
              <button className="px-5 py-2.5 bg-black/5 text-[var(--color-mark-ink)] rounded-xl text-xs font-bold hover:bg-black/10 transition-colors shadow-sm">
                Schedule Strategy Call
              </button>
            </div>
            <p className="text-sm text-[var(--color-mark-secondary)] mb-6">
              Your dedicated AI coach monitors revenue compliance and growth metrics to prevent payment lockouts.
            </p>

            <div className="space-y-4">
              {/* Compliance Card — all 5 milestones covered */}
              <div className={`p-5 rounded-2xl border ${compliance.color} flex gap-4 transition-all duration-300 shadow-sm`}>
                <div className="shrink-0 mt-0.5">{compliance.icon}</div>
                <div>
                  <h4 className="font-bold text-sm">{compliance.title}</h4>
                  <p className="text-xs mt-1.5 font-medium opacity-90 leading-relaxed max-w-xl">{compliance.desc}</p>
                  {compliance.type !== 'success' && (
                    <a href="/dashboard/settings" className="inline-flex items-center gap-1 text-[11px] font-bold mt-2 underline underline-offset-2">
                      Take Action <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Coach Insight */}
              <div className="p-5 rounded-2xl bg-black/[0.02] border border-black/5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--color-mark-ink)] flex items-center justify-center shrink-0 shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Coach Insight: Ready for Ads</h4>
                  <p className="text-xs text-[var(--color-mark-secondary)] font-medium mt-1.5 leading-relaxed max-w-xl">
                    Your store looks elegant. You have products and your UPI is connected. Run a Meta conversion campaign targeting 25–34 year olds in Tier 1 cities to get your first sale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        businessName={tenant.business_name}
      />

      <TrialExpiryModal
        trialMsLeft={trialMsLeft}
        onUpgrade={() => setShowUpgradeModal(true)}
      />
    </div>
  )
}
