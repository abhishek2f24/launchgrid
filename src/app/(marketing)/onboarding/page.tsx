'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { checkSubdomainAvailability, reserveSubdomain } from '@/actions/onboarding'
import { DriftingOrb } from '@/components/animations/DriftingOrb'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [subdomain, setSubdomain] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [email, setEmail] = useState('')
  const [niche, setNiche] = useState('Fashion & Apparel')
  
  const [subdomainStatus, setSubdomainStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Generate a simple session ID for subdomain locking
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' ? Math.random().toString(36).substring(2, 15) : ''
  )

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
    setSubdomain(val)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!val) {
      setSubdomainStatus('idle')
      return
    }

    setSubdomainStatus('checking')
    timeoutRef.current = setTimeout(async () => {
      const { available } = await checkSubdomainAvailability(val)
      setSubdomainStatus(available ? 'available' : 'taken')
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setErrorMessage('')
    setLoading(true)
    
    try {
      // 1. Double check availability and lock subdomain for 15 mins
      const res = await reserveSubdomain(subdomain, sessionId)
      if (!res.success) {
        setErrorMessage(res.error || 'Subdomain is no longer available.')
        setLoading(false)
        return
      }

      // 2. Route to provisioning with details in query parameters (simulating payment success check)
      setTimeout(() => {
        router.push(`/onboarding/provisioning?subdomain=${encodeURIComponent(subdomain)}&businessName=${encodeURIComponent(businessName)}&niche=${encodeURIComponent(niche)}&email=${encodeURIComponent(email)}`)
      }, 1000)
    } catch (err) {
      console.error(err)
      setErrorMessage('Failed to reserve subdomain. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col items-center justify-center p-6 relative antialiased">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--color-mark-amber)] opacity-[0.03] blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-[var(--color-mark-surface)] p-10 rounded-2xl border border-[var(--color-mark-default)] shadow-[var(--mark-shadow-lg)] relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <Sparkles className="w-24 h-24 text-[var(--color-mark-ink)]" />
        </div>
        
        <div className="relative z-10">
          <h1 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">Build your business.</h1>
          <p className="font-inter text-sm font-medium text-[var(--color-mark-secondary)]/60 mb-8">
            Your store goes live in 60 seconds. Free for 24 hours. No credit card needed.
          </p>
          
          {errorMessage && (
            <div className="p-4 bg-[var(--color-mark-red)]/5 border border-[var(--color-mark-red)]/20 text-[var(--color-mark-red)] text-xs font-bold rounded-lg flex items-start gap-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Email Address *</label>
              <input 
                required 
                type="email" 
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40 disabled:opacity-50" 
                placeholder="founder@example.com" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Business Name *</label>
              <input 
                required 
                type="text" 
                value={businessName}
                disabled={loading}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40 disabled:opacity-50" 
                placeholder="e.g. Aura Boutique" 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Niche / Category *</label>
              <select 
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)]"
              >
                <option>Fashion & Apparel</option>
                <option>Jewellery & Accessories</option>
                <option>Beauty & Cosmetics</option>
                <option>Home Decor</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Subdomain Preference</label>
              <div className="flex items-stretch relative">
                <input 
                  required 
                  type="text" 
                  value={subdomain}
                  onChange={handleSubdomainChange}
                  className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-l-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40" 
                  placeholder="aura" 
                />
                <div className="bg-[var(--color-mark-subtle)] border border-l-0 border-[var(--color-mark-default)] rounded-r-lg py-3 px-4 font-inter text-sm font-medium text-[var(--color-mark-secondary)]/60 flex items-center">
                  .launchgrid.in
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between font-inter text-xs font-medium">
                {subdomainStatus === 'checking' && <span className="text-[var(--color-mark-secondary)]/60">Checking availability...</span>}
                {subdomainStatus === 'available' && <span className="text-[var(--color-mark-green)] flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Available!</span>}
                {subdomainStatus === 'taken' && <span className="text-[var(--color-mark-red)] flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Unavailable.</span>}
                {!subdomain && <span className="text-[var(--color-mark-secondary)]/40">Letters, numbers, and dashes only</span>}
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading || subdomainStatus !== 'available'} 
                className="w-full bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] font-inter font-bold text-sm py-3.5 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {loading ? 'Setting up your store...' : 'Start Free — 24 Hours, No Card Required'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
