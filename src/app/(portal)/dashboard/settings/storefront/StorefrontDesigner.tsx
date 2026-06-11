'use client'

import { useState, useTransition } from 'react'
import { Palette, Layout, Type, ExternalLink, Check, Loader2, Sparkles } from 'lucide-react'

// ── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal Dark',
    desc: 'Clean, editorial. Dark background, light typography. Great for electronics and fashion.',
    preview: (color: string) => (
      <div className="w-full h-full bg-[#050505] flex flex-col p-3 gap-2">
        <div className="flex gap-1 mb-1">
          <div className="w-3 h-2 rounded bg-white/10" />
          <div className="flex-1 h-2 rounded bg-white/5" />
          <div className="w-4 h-2 rounded bg-white/10" />
        </div>
        <div className="flex flex-col items-center py-3 gap-1.5">
          <div className="w-24 h-2 rounded bg-white/50" />
          <div className="w-16 h-1.5 rounded bg-white/20" />
          <div className="w-12 h-3 rounded-full mt-1" style={{ background: color }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white/5 rounded-lg overflow-hidden">
              <div className="aspect-square bg-white/10 rounded-t-lg" />
              <div className="p-1.5 space-y-1">
                <div className="w-full h-1 rounded bg-white/20" />
                <div className="w-8 h-1 rounded" style={{ background: color + '99' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'bold',
    name: 'Bold Impact',
    desc: 'Large headlines, strong contrast. Perfect for sportswear, streetwear, or youth brands.',
    preview: (color: string) => (
      <div className="w-full h-full bg-[#0a0a0a] flex flex-col p-3 gap-2">
        <div className="flex gap-1 mb-1">
          <div className="w-3 h-2 rounded bg-white/10" />
          <div className="flex-1 h-2 rounded bg-white/5" />
        </div>
        <div className="py-3 flex flex-col gap-1 rounded-lg px-2" style={{ background: color + '22' }}>
          <div className="w-20 h-4 rounded bg-white/80 mx-auto" />
          <div className="w-14 h-2 rounded bg-white/30 mx-auto" />
          <div className="w-12 h-4 rounded mx-auto mt-1" style={{ background: color }} />
        </div>
        <div className="grid grid-cols-3 gap-1 mt-1">
          {[1,2,3].map(i => (
            <div key={i} className="bg-[#111] rounded overflow-hidden">
              <div className="aspect-square bg-white/10" />
              <div className="p-1">
                <div className="w-full h-1 rounded bg-white/30" />
                <div className="w-6 h-1 rounded mt-1" style={{ background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'luxury',
    name: 'Luxury Editorial',
    desc: 'Serif fonts, cream palette, editorial spacing. For jewellery, skincare, premium goods.',
    preview: (color: string) => (
      <div className="w-full h-full bg-[#faf8f4] flex flex-col p-3 gap-2">
        <div className="flex gap-1 border-b border-black/10 pb-1.5 mb-1">
          <div className="w-10 h-1.5 rounded bg-black/30" />
          <div className="flex-1" />
          {[1,2,3].map(i => <div key={i} className="w-5 h-1.5 rounded bg-black/20" />)}
        </div>
        <div className="flex flex-col items-center py-2 gap-1 border-b border-black/8 mb-1">
          <div className="w-2 h-2 rounded-full mb-0.5" style={{ background: color }} />
          <div className="w-20 h-2.5 rounded bg-black/40" />
          <div className="w-14 h-1.5 rounded bg-black/20" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1,2,3,4].map(i => (
            <div key={i}>
              <div className="aspect-[4/5] rounded-sm mb-1" style={{ background: '#ede9e0' }} />
              <div className="w-12 h-1 rounded bg-black/30" />
              <div className="w-8 h-1 rounded bg-black/15 mt-0.5" />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'warm',
    name: 'Warm & Friendly',
    desc: 'Soft gradients, rounded corners, warm tones. Great for food, gifts, home decor, kids.',
    preview: (color: string) => (
      <div className="w-full h-full flex flex-col p-3 gap-2" style={{ background: 'linear-gradient(135deg,#fff8f0,#fef9f5)' }}>
        <div className="flex gap-1 mb-0.5">
          <div className="w-5 h-2 rounded-full bg-black/15" />
          <div className="flex-1" />
          <div className="w-3 h-2 rounded-full" style={{ background: color + '40' }} />
        </div>
        <div className="rounded-2xl p-3 flex flex-col items-center gap-1.5" style={{ background: color + '15' }}>
          <div className="w-20 h-2 rounded-full bg-black/30" />
          <div className="w-14 h-1.5 rounded-full bg-black/15" />
          <div className="w-14 h-3 rounded-full mt-1" style={{ background: color }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="aspect-square" style={{ background: color + '20' }} />
              <div className="p-1.5 space-y-0.5">
                <div className="w-full h-1 rounded-full bg-black/15" />
                <div className="w-8 h-1 rounded-full" style={{ background: color + '80' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'vibrant',
    name: 'Vibrant & Bold',
    desc: 'High energy, gradient accents, glowing CTAs. For cosmetics, accessories, lifestyle brands.',
    preview: (color: string) => (
      <div className="w-full h-full flex flex-col p-3 gap-2 bg-[#0d0d0d]">
        <div className="flex gap-1 mb-0.5">
          <div className="w-4 h-2 rounded bg-white/20" />
          <div className="flex-1" />
          <div className="w-3 h-2 rounded" style={{ background: color }} />
        </div>
        <div className="rounded-xl p-3 flex flex-col items-center gap-1.5" style={{ background: `linear-gradient(135deg,${color}33,${color}11)`, border: `1px solid ${color}33` }}>
          <div className="w-20 h-2.5 rounded bg-white/80" />
          <div className="w-14 h-1.5 rounded bg-white/30" />
          <div className="w-16 h-3 rounded-lg mt-1 bg-white" style={{ boxShadow: `0 0 12px ${color}88` }} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
              <div className="aspect-square" style={{ background: `linear-gradient(135deg,${color}30,${color}10)` }} />
              <div className="p-1.5 space-y-0.5">
                <div className="w-full h-1 rounded bg-white/20" />
                <div className="w-8 h-1 rounded" style={{ background: color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

// ── Accent Colors ─────────────────────────────────────────────────────────────
const COLORS = [
  { id: 'purple',  hex: '#8b5cf6', name: 'Violet'  },
  { id: 'blue',    hex: '#3b82f6', name: 'Blue'    },
  { id: 'emerald', hex: '#10b981', name: 'Emerald' },
  { id: 'rose',    hex: '#f43f5e', name: 'Rose'    },
  { id: 'amber',   hex: '#f59e0b', name: 'Amber'   },
  { id: 'orange',  hex: '#f97316', name: 'Coral'   },
  { id: 'indigo',  hex: '#6366f1', name: 'Indigo'  },
  { id: 'mono',    hex: '#e5e7eb', name: 'Silver'  },
]

interface Props {
  subdomain: string
  initialTemplate: string
  initialColor: string
  initialTagline: string
  initialSubtitle: string
}

export function StorefrontDesigner({ subdomain, initialTemplate, initialColor, initialTagline, initialSubtitle }: Props) {
  const [template, setTemplate] = useState(initialTemplate || 'minimal')
  const [color,    setColor]    = useState(initialColor    || 'purple')
  const [tagline,  setTagline]  = useState(initialTagline  || '')
  const [subtitle, setSubtitle] = useState(initialSubtitle || '')
  const [saved,    setSaved]    = useState(false)
  const [isPending, startTransition] = useTransition()

  const activeColor = COLORS.find(c => c.id === color)?.hex || '#8b5cf6'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await fetch('/api/settings/storefront', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_style: template, theme_color: color, tagline, hero_subtitle: subtitle }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    })
  }

  return (
    <div className="p-8 max-w-5xl mx-auto font-inter space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-1">Storefront Design</h1>
          <p className="text-sm text-[var(--color-mark-secondary)]">Customize how your store looks to every customer.</p>
        </div>
        {subdomain && (
          <a href={`https://${subdomain}.launchgrid.in`} target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm font-bold text-[var(--color-mark-ink)] hover:bg-black/5 shadow-sm transition-colors shrink-0">
            <ExternalLink className="w-4 h-4" /> Preview Store
          </a>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Template Picker ── */}
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Layout className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-mark-ink)]">Store Template</h2>
              <p className="text-xs text-[var(--color-mark-secondary)]">Choose the look and feel of your entire storefront</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                className={`relative flex flex-col rounded-2xl border-2 overflow-hidden transition-all duration-200 text-left ${
                  template === t.id
                    ? 'border-[var(--color-mark-ink)] shadow-lg scale-[1.02]'
                    : 'border-black/8 hover:border-black/20 hover:shadow-md'
                }`}
              >
                <div className="aspect-[3/4] w-full overflow-hidden">
                  {t.preview(activeColor)}
                </div>
                <div className={`p-2.5 ${template === t.id ? 'bg-[var(--color-mark-ink)]' : 'bg-black/[0.02]'}`}>
                  <p className={`text-[11px] font-extrabold truncate ${template === t.id ? 'text-white' : 'text-[var(--color-mark-ink)]'}`}>
                    {t.name}
                  </p>
                </div>
                {template === t.id && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-mark-ink)] flex items-center justify-center shadow-lg">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-black/[0.02] rounded-xl border border-black/5">
            <p className="text-xs text-[var(--color-mark-secondary)] font-medium">
              <span className="font-bold text-[var(--color-mark-ink)]">{TEMPLATES.find(t => t.id === template)?.name}:</span>{' '}
              {TEMPLATES.find(t => t.id === template)?.desc}
            </p>
          </div>
        </div>

        {/* ── Color Picker ── */}
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-5">
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
              <Palette className="w-4 h-4 text-pink-600" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-mark-ink)]">Accent Color</h2>
              <p className="text-xs text-[var(--color-mark-secondary)]">Applied to buttons, prices, CTAs, and highlights sitewide</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {COLORS.map(c => (
              <button key={c.id} type="button" onClick={() => setColor(c.id)} className="flex flex-col items-center gap-1.5">
                <div className={`w-10 h-10 rounded-full transition-all duration-200 ${
                  color === c.id
                    ? 'ring-2 ring-offset-2 ring-[var(--color-mark-ink)] scale-110 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`} style={{ background: c.hex }} />
                <span className={`text-[10px] font-bold ${color === c.id ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]/50'}`}>
                  {c.name}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2 items-center">
            <div className="flex-1 h-2 rounded-full" style={{ background: activeColor }} />
            <div className="flex-1 h-2 rounded-full opacity-60" style={{ background: activeColor }} />
            <div className="flex-1 h-2 rounded-full opacity-25" style={{ background: activeColor }} />
            <code className="text-[10px] font-mono text-[var(--color-mark-secondary)] bg-black/5 px-2 py-0.5 rounded-md">{activeColor}</code>
          </div>
        </div>

        {/* ── Text Content ── */}
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm p-7">
          <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Type className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--color-mark-ink)]">Hero Text</h2>
              <p className="text-xs text-[var(--color-mark-secondary)]">The headline and subtext shown at the top of your storefront</p>
            </div>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">Hero Headline</label>
              <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Premium Quality, Delivered to Your Door" maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
              />
              <p className="text-[10px] text-[var(--color-mark-secondary)]/40">{tagline.length}/80 characters</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-secondary)]/60">
                Hero Subtitle <span className="normal-case font-semibold text-[var(--color-mark-secondary)]/40">Optional</span>
              </label>
              <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
                placeholder="e.g. Shop securely with fast delivery and easy returns" maxLength={120}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-sm text-[var(--color-mark-ink)] focus:outline-none focus:border-[var(--color-mark-ink)] focus:ring-1 focus:ring-[var(--color-mark-ink)] transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Sticky Save Bar ── */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: activeColor }} />
              <div>
                <p className="text-sm font-bold text-[var(--color-mark-ink)]">
                  {TEMPLATES.find(t => t.id === template)?.name} · {COLORS.find(c => c.id === color)?.name}
                </p>
                <p className="text-xs text-[var(--color-mark-secondary)]">Changes apply immediately on save</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {subdomain && (
                <a href={`https://${subdomain}.launchgrid.in`} target="_blank"
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Preview
                </a>
              )}
              <button type="submit" disabled={isPending}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2 shadow-md ${
                  saved ? 'bg-green-500 text-white' : 'bg-[var(--color-mark-ink)] text-white hover:bg-black/90'
                }`}
              >
                {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : saved  ? <><Check className="w-4 h-4" /> Saved!</>
                  : <><Sparkles className="w-4 h-4" /> Save Design</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
