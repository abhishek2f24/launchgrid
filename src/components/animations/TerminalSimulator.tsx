'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function TerminalSimulator() {
  const steps = [
    { text: 'Initialising secure workspace...', duration: 1200 },
    { text: 'Provisioning multi-tenant database nodes...', duration: 1500 },
    { text: 'Deploying serverless background orchestrators...', duration: 1000 },
    { text: 'Wiring Razorpay payment keys...', duration: 1300 },
    { text: 'Importing Dropship supply catalog (50 items)...', duration: 1400 },
    { text: 'Generating SSL & routing domain rules...', duration: 1100 },
    { text: 'Launch complete. Store is live tomorrow!', duration: 0 }
  ]

  const [visibleLogs, setVisibleLogs] = useState<{ text: string; status: 'done' | 'loading' | 'pending' }[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= steps.length) {
      // Loop simulator after 4 seconds
      const timeout = setTimeout(() => {
        setVisibleLogs([])
        setCurrentStep(0)
      }, 4000)
      return () => clearTimeout(timeout)
    }

    // Set previous items to 'done', add current as 'loading'
    setVisibleLogs(prev => {
      const nextLogs: { text: string; status: 'done' | 'loading' | 'pending' }[] = prev.map(log => ({ ...log, status: 'done' as const }))
      const isLast = currentStep === steps.length - 1
      nextLogs.push({
        text: steps[currentStep].text,
        status: isLast ? ('done' as const) : ('loading' as const)
      })
      return nextLogs
    })

    if (steps[currentStep].duration > 0) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, steps[currentStep].duration)
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  return (
    <div className="w-full max-w-lg glass-card p-6 font-mono text-xs text-left bg-black/60 border-white/5 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      <div className="flex items-center gap-2 mb-5 border-b border-white/5 pb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/60" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
        <span className="text-slate-500 ml-2 text-[10px]">launchgrid_terminal_engine.sh</span>
      </div>

      <div className="space-y-3 min-h-[160px]">
        {visibleLogs.map((log, index) => (
          <div key={index} className="flex items-start gap-2.5">
            <span className="text-violet-500 select-none shrink-0">$</span>
            <div className="flex items-center gap-2 flex-1">
              <span className={log.status === 'done' ? 'text-slate-400' : 'text-cyan-400 font-bold'}>
                {log.text}
              </span>
              {log.status === 'loading' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />}
              {log.status === 'done' && index === visibleLogs.length - 1 && currentStep === steps.length - 1 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              )}
            </div>
          </div>
        ))}
        {currentStep < steps.length && (
          <div className="flex items-center gap-1 opacity-60">
            <span className="text-violet-500 select-none">$</span>
            <span className="w-1.5 h-3 bg-cyan-400 animate-pulse inline-block" />
          </div>
        )}
      </div>
    </div>
  )
}
