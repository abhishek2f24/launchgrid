'use client'

import { useState, useEffect } from "react"
import { AlertTriangle, PackageOpen, CreditCard, Send, CheckCircle2 } from "lucide-react"

export function PanicStateModal({ order }: { order: any }) {
  const [activeStep, setActiveStep] = useState(1)
  const [completed, setCompleted] = useState<number[]>([])
  const [dismissed, setDismissed] = useState(true) // default true until mount check

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dismissed_panic_orders')
      if (stored) {
        const list = JSON.parse(stored)
        if (list.includes(order.id)) {
          setDismissed(true)
          return
        }
      }
    } catch {}
    setDismissed(false)
  }, [order.id])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      const stored = localStorage.getItem('dismissed_panic_orders')
      const list = stored ? JSON.parse(stored) : []
      if (!list.includes(order.id)) {
        list.push(order.id)
        localStorage.setItem('dismissed_panic_orders', JSON.stringify(list))
      }
    } catch {}
  }

  const steps = [
    {
      id: 1,
      title: "Confirm Your Funds",
      description: `Did you receive ₹${order.total_amount} in your GPay app? Confirm the funds before touching inventory.`,
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      id: 2,
      title: "Pay Dropship Supplier",
      description: "Razorpay takes 2 days to clear. Use your own UPI to immediately pay GlowRoad so the item ships today.",
      icon: <PackageOpen className="w-5 h-5" />,
    },
    {
      id: 3,
      title: "Mark as Fulfilled",
      description: "Update the order status so LaunchGrid knows the supplier has taken over.",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      id: 4,
      title: "Add Tracking Link",
      description: "Once GlowRoad gives you an AWB number, paste it here. We will email the customer automatically.",
      icon: <Send className="w-5 h-5" />,
    }
  ]

  const completeStep = (id: number) => {
    if (!completed.includes(id)) {
      setCompleted([...completed, id])
      if (activeStep < steps.length) {
        setActiveStep(activeStep + 1)
      }
    }
  }

  // If all completed, return null to unblock the dashboard
  if (completed.length === steps.length || dismissed) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300 font-inter">
      <div className="bg-white border border-black/10 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-8 bg-green-50 border-b border-green-100 flex items-center gap-5 relative">
          <div className="p-4 bg-white rounded-full border border-green-200 text-3xl shadow-sm animate-bounce">
            🎉
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-playfair font-extrabold text-[var(--color-mark-ink)] mb-1">
              FIRST SALE! Order {order.id.slice(0, 8)}
            </h2>
            <p className="text-green-700 text-sm font-bold tracking-wide">₹{order.total_amount} Revenue Generated</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-green-100 text-green-700 transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex flex-col gap-8 bg-[var(--color-mark-base)]">
          <div className="flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900 leading-relaxed font-medium">
              <strong className="font-bold">Don't panic!</strong> First orders can be overwhelming. Follow this strict 4-step checklist to safely fulfill your customer's order without losing money. You cannot close this until the order is handled.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {steps.map((step) => {
              const isCompleted = completed.includes(step.id)
              const isActive = activeStep === step.id

              return (
                <div 
                  key={step.id}
                  className={`p-5 rounded-2xl flex items-start gap-5 transition-all duration-300 ${
                    isCompleted ? 'bg-green-50 border border-green-200 opacity-90' :
                    isActive ? 'bg-white border border-black/10 shadow-lg scale-[1.01]' :
                    'bg-black/[0.02] border border-transparent opacity-50 grayscale'
                  }`}
                >
                  <div className={`p-3 rounded-full shrink-0 shadow-sm ${
                    isCompleted ? 'bg-green-100 text-green-700' :
                    isActive ? 'bg-[var(--color-mark-ink)] text-white' :
                    'bg-white text-[var(--color-mark-secondary)] border border-black/10'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
                  </div>
                  <div className="flex-1 mt-0.5">
                    <h4 className={`text-base font-bold ${isCompleted ? 'text-green-800' : isActive ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]'}`}>
                      Step {step.id}: {step.title}
                    </h4>
                    <p className={`text-sm mt-1.5 leading-relaxed ${isCompleted ? 'text-green-700/80 font-medium' : isActive ? 'text-[var(--color-mark-secondary)] font-medium' : 'text-[var(--color-mark-secondary)]'}`}>
                      {step.description}
                    </p>
                    
                    {isActive && step.id === 3 && (
                      <div className="mt-5 flex items-center gap-3">
                        <button 
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/orders/fulfill', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: order.id })
                              })
                              if (res.ok) completeStep(step.id)
                            } catch (e) {
                              console.error(e)
                            }
                          }}
                          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 cursor-pointer shadow-md transition-transform active:scale-95 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" /> 1-Click Shiprocket Fulfillment
                        </button>
                        <button 
                          onClick={() => completeStep(step.id)}
                          className="px-6 py-2.5 bg-transparent border border-black/10 text-[var(--color-mark-secondary)] text-sm font-bold rounded-xl hover:bg-black/5 cursor-pointer transition-colors"
                        >
                          Mark manually
                        </button>
                      </div>
                    )}
                    {isActive && step.id !== 3 && (
                      <button 
                        onClick={() => completeStep(step.id)}
                        className="mt-5 px-6 py-2.5 bg-[var(--color-mark-ink)] text-white text-sm font-bold rounded-xl hover:bg-black/90 cursor-pointer shadow-md transition-transform active:scale-95"
                      >
                        I have completed this
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
