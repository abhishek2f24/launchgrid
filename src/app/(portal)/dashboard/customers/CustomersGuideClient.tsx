'use client'

import { Users, CheckCircle2, MessageCircle, AlertCircle, ShoppingCart, Mail } from 'lucide-react'
import Link from 'next/link'

interface Props {
  hasWhatsApp: boolean
  whatsappNumber: string | null
}

export function CustomersGuideClient({ hasWhatsApp, whatsappNumber }: Props) {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 font-inter">
      {/* Overview header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[2rem] p-8 shadow-sm">
        <div className="space-y-3 max-w-xl">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Users className="w-5 h-5 animate-pulse" />
          </div>
          <h2 className="font-playfair text-2xl font-bold text-blue-950">Build customer trust.</h2>
          <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
            Customers will automatically appear here once they place an order on your storefront. 
            Use this page to check contact information and track their customer lifetime value (LTV).
          </p>
        </div>
      </div>

      {/* Progressive guidance checklist */}
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-6">
        <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] border-b border-black/5 pb-4">
          Customer Engagement Checklist
        </h3>

        <div className="space-y-4">
          {/* STEP 1: Support Line */}
          <div className={`flex gap-4 items-start p-5 rounded-2xl border transition-all ${
            hasWhatsApp ? 'bg-green-50/50 border-green-100' : 'bg-white border-black/5 shadow-sm ring-1 ring-[var(--color-mark-ink)]/5'
          }`}>
            <div className="shrink-0 mt-0.5">
              {hasWhatsApp ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">1</div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Connect Customer Support Line</h4>
                {hasWhatsApp && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">
                    Active ({whatsappNumber})
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Add your support WhatsApp number to display a chat widget on your storefront. This removes buyer friction and increases checkout conversions.
              </p>
              {!hasWhatsApp && (
                <div className="pt-2">
                  <Link href="/dashboard/settings" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 transition-all shadow-md">
                    <MessageCircle className="w-3.5 h-3.5" /> Configure Support Widget →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: Abandoned Cart Recovery */}
          <div className="flex gap-4 items-start p-5 rounded-2xl border bg-green-50/50 border-green-100">
            <div className="shrink-0 mt-0.5">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Automated Cart Recovery Enabled</h4>
                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Running</span>
              </div>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                LaunchGrid automatically monitors checkout drop-offs and dispatches a recover email via Resend after 1 hour of abandonment. 
                Zero configuration needed.
              </p>
            </div>
          </div>

          {/* STEP 3: Drive Sales */}
          <div className="flex gap-4 items-start p-5 rounded-2xl border bg-white border-black/5 shadow-sm">
            <div className="shrink-0 mt-0.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">2</div>
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Acquire Your First Customer</h4>
              <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">
                Get visitors to your storefront by sharing your store link. Complete your store checklist on the orders tab to launch properly.
              </p>
              <div className="pt-2">
                <Link href="/dashboard/orders" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-mark-ink)] text-white text-xs font-bold rounded-xl hover:bg-black/90 transition-all shadow-md">
                  <ShoppingCart className="w-3.5 h-3.5" /> View Launch Checklist →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
