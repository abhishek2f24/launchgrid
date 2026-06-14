'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { DriftingOrb } from '@/components/animations/DriftingOrb'
import { trackCompleteRegistration } from '@/lib/pixel'

function ProvisioningTerminal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subdomain = searchParams.get('subdomain')
  const businessName = searchParams.get('businessName')
  const niche = searchParams.get('niche')
  const supabase = createClient()

  const [logs, setLogs] = useState<{ id: number; text: string; status: 'loading' | 'done' | 'pending' }[]>([
    { id: 1, text: 'Authenticating secure session...', status: 'loading' },
    { id: 2, text: 'Provisioning multi-tenant database...', status: 'pending' },
    { id: 3, text: 'Generating AI brand identity & logo...', status: 'pending' },
    { id: 4, text: 'Wiring Razorpay payment nodes...', status: 'pending' },
    { id: 5, text: 'Importing dropship catalog (50 items)...', status: 'pending' },
    { id: 6, text: 'Finalizing storefront...', status: 'pending' },
  ])

  useEffect(() => {
    let currentStep = 0
    const interval = setInterval(() => {
      setLogs(prev => {
        const nextLogs = [...prev]
        if (currentStep < nextLogs.length) {
          nextLogs[currentStep].status = 'done'
        }
        if (currentStep + 1 < nextLogs.length) {
          nextLogs[currentStep + 1].status = 'loading'
        }
        return nextLogs
      })
      currentStep++
      
      if (currentStep >= logs.length) {
        clearInterval(interval)
        setTimeout(async () => {
          trackCompleteRegistration()
          // Check auth state — if logged in go to /setup, otherwise go to /signup
          const { data: { session } } = await supabase.auth.getSession()
          const params = new URLSearchParams()
          if (subdomain) params.set('subdomain', subdomain)
          if (businessName) params.set('businessName', businessName)
          if (niche) params.set('niche', niche)
          const qs = params.toString()
          if (session) {
            router.push(qs ? `/setup?${qs}` : '/setup')
          } else {
            router.push(qs ? `/signup?${qs}` : '/signup')
          }
        }, 1500)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [router, logs.length])

  return (
    <div className="min-h-screen bg-[#050505] text-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Noise Overlay */}
      <div className="absolute inset-0 noise-overlay" />

      {/* Aurora Drifting Glows */}
      <DriftingOrb className="top-1/4 left-1/4 w-[500px] h-[500px]" color="bg-violet-500/10" />
      <DriftingOrb className="bottom-1/4 right-1/4 w-[600px] h-[600px]" color="bg-cyan-500/10" />
      
      <div className="max-w-md w-full relative z-10 flex flex-col items-center text-center mb-8">
        <div className="p-3 bg-violet-500/10 rounded-full border border-violet-500/20 mb-6 animate-pulse">
          <Sparkles className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Forging Your Empire
        </h1>
        <p className="text-sm font-medium text-slate-400 max-w-sm">
          Please don&apos;t close this window. Our AI agents are constructing your business architecture.
        </p>
      </div>

      <div className="w-full max-w-lg glass-card p-6 font-mono text-sm bg-black/60 border-white/10 shadow-2xl shadow-black relative z-10">
        <div className="flex items-center gap-2 mb-5 border-b border-white/5 pb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
          <span className="text-xs font-bold text-slate-500 ml-2">launchgrid_builder_agent.sh</span>
        </div>
        
        <div className="space-y-4">
          {logs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 transition-all duration-300" 
              style={{ opacity: log.status === 'pending' ? 0.25 : 1 }}
            >
              <div className="mt-0.5 shrink-0">
                {log.status === 'done' && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />}
                {log.status === 'loading' && <Loader2 className="w-4.5 h-4.5 text-cyan-400 animate-spin" />}
                {log.status === 'pending' && <div className="w-4.5 h-4.5 rounded-full border border-white/20" />}
              </div>
              <span className={log.status === 'done' ? 'text-slate-400 font-medium' : log.status === 'loading' ? 'text-cyan-400 font-bold' : 'text-slate-500 font-medium'}>
                {log.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProvisioningPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <ProvisioningTerminal />
    </Suspense>
  )
}
