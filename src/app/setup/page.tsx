'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, AlertCircle, CheckCircle, ChevronRight, Store, Palette, PhoneCall, Loader2 } from 'lucide-react'

function SetupPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPlan = searchParams.get('plan') || 'starter'
  const urlBilling = searchParams.get('billing') || 'monthly'

  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    businessName: '',
    subdomain: '',
    niche: '',
    whatsappNumber: '',
    shippingScope: 'intra_state',
    themeColor: 'purple',
    templateStyle: 'minimal'
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Auto-generate subdomain from business name if empty
    if (field === 'businessName' && !formData.subdomain && value) {
      setFormData(prev => ({ 
        ...prev, 
        subdomain: value.toLowerCase().replace(/[^a-z0-9]/g, '') 
      }))
    }
  }

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => prev - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          plan: urlPlan,
          billing: urlBilling
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to setup store')
      
      // Hard redirect to dashboard to clear layout cache and fetch new tenant
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex items-center justify-center p-4 relative antialiased">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[var(--color-mark-amber)] opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-2xl bg-[var(--color-mark-surface)] p-8 md:p-12 rounded-2xl border border-[var(--color-mark-default)] shadow-[var(--mark-shadow-lg)] relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
          <Sparkles className="w-32 h-32 text-[var(--color-mark-ink)]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-playfair text-3xl font-bold text-[var(--color-mark-ink)] mb-2">Setup Your Store.</h1>
              <p className="font-inter text-sm font-medium text-[var(--color-mark-secondary)]/60">Let&apos;s get your business online in 60 seconds.</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 w-10 rounded-full transition-colors duration-500 ${step >= i ? 'bg-[var(--color-mark-ink)]' : 'bg-[var(--color-mark-default)]'}`} />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-[var(--color-mark-red)]/5 border border-[var(--color-mark-red)]/20 text-[var(--color-mark-red)] text-xs font-bold rounded-lg flex items-start gap-3 mb-6">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: BUSINESS DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-[var(--color-mark-ink)] mb-6 border-b border-[var(--color-mark-default)] pb-4">
                  <Store className="h-5 w-5" />
                  <h2 className="font-inter text-sm font-bold">Business Details</h2>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Store Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. The Urban Baker" 
                      className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40"
                      value={formData.businessName}
                      onChange={(e) => handleChange('businessName', e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Store Link (Subdomain)</label>
                    <div className="flex items-stretch relative">
                      <input 
                        type="text"
                        placeholder="theurbanbaker" 
                        className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-l-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40"
                        value={formData.subdomain}
                        onChange={(e) => handleChange('subdomain', e.target.value)}
                      />
                      <div className="bg-[var(--color-mark-subtle)] border border-l-0 border-[var(--color-mark-default)] rounded-r-lg py-3 px-4 font-inter text-sm font-medium text-[var(--color-mark-secondary)]/60 flex items-center">
                        .launchgrid.in
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Industry / Niche</label>
                    <select 
                      value={formData.niche} 
                      onChange={(e) => handleChange('niche', e.target.value)}
                      className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)]"
                    >
                      <option value="">Select an industry</option>
                      <option value="Fashion">Apparel & Fashion</option>
                      <option value="Food">Food & Bakery</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Home">Home & Decor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    disabled={!formData.businessName || !formData.subdomain || !formData.niche}
                    onClick={handleNext}
                    className="bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] font-inter font-bold text-sm py-3 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BRANDING */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-blue-500 mb-6 border-b border-[var(--color-mark-default)] pb-4">
                  <Palette className="h-5 w-5" />
                  <h2 className="font-inter text-sm font-bold">Brand Identity</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-3">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Theme Color</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { id: 'purple',  hex: '#8b5cf6', name: 'Violet'  },
                        { id: 'blue',    hex: '#3b82f6', name: 'Ocean'   },
                        { id: 'emerald', hex: '#10b981', name: 'Emerald' },
                        { id: 'rose',    hex: '#f43f5e', name: 'Rose'    },
                        { id: 'amber',   hex: '#f59e0b', name: 'Amber'   },
                        { id: 'orange',  hex: '#f97316', name: 'Coral'   },
                        { id: 'indigo',  hex: '#6366f1', name: 'Indigo'  },
                        { id: 'mono',    hex: '#e5e7eb', name: 'Silver'  },
                      ].map(color => (
                        <button
                          key={color.id}
                          onClick={() => handleChange('themeColor', color.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                            formData.themeColor === color.id ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-subtle)] font-bold' : 'border-[var(--color-mark-default)] hover:border-[var(--color-mark-ink)]/50'
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full shadow-inner" style={{ backgroundColor: color.hex }} />
                          <span className="text-[10px] font-medium text-[var(--color-mark-secondary)]">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Template Style</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { id: 'minimal', name: 'Minimal', desc: 'Clean, dark' },
                        { id: 'bold', name: 'Bold', desc: 'High contrast' },
                        { id: 'luxury', name: 'Luxury', desc: 'Serif, cream' },
                        { id: 'warm', name: 'Warm', desc: 'Warm gradients' },
                        { id: 'vibrant', name: 'Vibrant', desc: 'Gradient glow' },
                      ].map(tmpl => (
                        <button
                          key={tmpl.id}
                          onClick={() => handleChange('templateStyle', tmpl.id)}
                          className={`p-4 rounded-xl border-2 transition-all text-center flex flex-col justify-between min-h-[90px] cursor-pointer ${
                            formData.templateStyle === tmpl.id ? 'border-[var(--color-mark-ink)] bg-[var(--color-mark-subtle)] font-bold' : 'border-[var(--color-mark-default)] hover:border-[var(--color-mark-ink)]/50'
                          }`}
                        >
                          <h3 className="font-inter font-bold text-xs text-[var(--color-mark-primary)] mb-1 leading-snug">{tmpl.name}</h3>
                          <p className="text-[10px] text-[var(--color-mark-secondary)]/80 leading-relaxed font-medium">{tmpl.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-between">
                  <button onClick={handleBack} className="text-sm font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]">Back</button>
                  <button 
                    onClick={handleNext}
                    className="bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] font-inter font-bold text-sm py-3 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-md"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTACT */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-[var(--color-mark-green)] mb-6 border-b border-[var(--color-mark-default)] pb-4">
                  <PhoneCall className="h-5 w-5" />
                  <h2 className="font-inter text-sm font-bold">Store Settings</h2>
                </div>

                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Customer Support WhatsApp</label>
                    <input 
                      type="tel"
                      placeholder="+91 9876543210" 
                      className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)] placeholder:text-[var(--color-mark-secondary)]/40"
                      value={formData.whatsappNumber}
                      onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    />
                    <p className="text-xs text-[var(--color-mark-secondary)]/60">This will add a floating WhatsApp chat button to your store.</p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="font-inter text-sm font-medium text-[var(--color-mark-primary)]">Shipping Scope (For Tax Settings)</label>
                    <select 
                      value={formData.shippingScope} 
                      onChange={(e) => handleChange('shippingScope', e.target.value)}
                      className="w-full bg-transparent border border-[var(--color-mark-default)] rounded-lg py-3 px-4 font-inter text-sm focus:outline-none focus:border-[var(--color-mark-ink)] transition-colors text-[var(--color-mark-primary)]"
                    >
                      <option value="intra_state">Only within my state (No GST required yet)</option>
                      <option value="inter_state">Across India (GST mandatory)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex justify-between">
                  <button onClick={handleBack} disabled={isSubmitting} className="text-sm font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] disabled:opacity-50 font-medium">Back</button>
                  <button 
                    disabled={isSubmitting || !formData.whatsappNumber}
                    onClick={handleSubmit}
                    className="bg-[var(--color-mark-ink)] text-[var(--color-mark-inverse)] font-inter font-bold text-sm py-3 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Provisioning...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Launch My Store</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-mark-base)] flex items-center justify-center font-inter text-xs font-bold text-[var(--color-mark-secondary)]">Loading Setup...</div>}>
      <SetupPageClient />
    </Suspense>
  )
}
