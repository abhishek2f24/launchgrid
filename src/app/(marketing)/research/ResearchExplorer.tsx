'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import {
  ArrowRight, CheckCircle2, CircleAlert, Search, SearchCheck, Store, WalletCards,
  Activity, Sparkles, PawPrint, Smartphone, HeartPulse, Car, UtensilsCrossed, Scissors, Leaf, Tag, X,
} from 'lucide-react'
import { PLANS } from '@/lib/plans'

const FREE_RESEARCH_LIMIT = PLANS.free.features.research_ideas_per_month

const signals = [
  { label: 'Market evidence', detail: 'Comparable listings, price points, demand signals, and review themes', icon: SearchCheck },
  { label: 'Supplier evidence', detail: 'Business documents, factory details, quotations, and MOQ terms', icon: Search },
  { label: 'Landed cost', detail: 'Unit price, freight, duties, packaging, and allowance assumptions', icon: WalletCards },
]

// Cosmetic pairing only — which categories exist, and how many reports are
// in each, always comes from the live /api/research/public-categories query
// below. An unrecognized category still renders (with the Tag fallback),
// it just won't have a bespoke icon yet.
const CATEGORY_ICONS: { match: RegExp; icon: typeof Tag }[] = [
  { match: /wearable|fitness/i, icon: Activity },
  { match: /beauty|skincare/i, icon: Sparkles },
  { match: /pet/i, icon: PawPrint },
  { match: /mobile|accessor/i, icon: Smartphone },
  { match: /wellness|health/i, icon: HeartPulse },
  { match: /auto|car/i, icon: Car },
  { match: /kitchen/i, icon: UtensilsCrossed },
  { match: /groom/i, icon: Scissors },
  { match: /eco/i, icon: Leaf },
]

function iconFor(category: string) {
  return CATEGORY_ICONS.find((c) => c.match.test(category))?.icon ?? Tag
}

type PublicReportMatch = {
  slug: string
  name: string
  category: string | null
  targetRetailPrice: number | null
  supplierCount: number
  score: number | null
  recommendation: string | null
  matchReasons: string[]
}

type CategoryCount = { category: string; count: number }

/** Shown when nothing matched at all, so the screen is never empty. */
type Suggestions = {
  category: string | null
  reason: string
  results: PublicReportMatch[]
  otherCategories: string[]
}

export function ResearchExplorer({ initialIdea, initialCategory }: { initialIdea: string; initialCategory?: string }) {
  const router = useRouter()
  const [idea, setIdea] = useState(initialIdea)
  const [matches, setMatches] = useState<PublicReportMatch[]>([])
  // Word-relevant but not confident enough to call a match — see the
  // CONFIDENT_MATCH_SCORE note in the search route.
  const [related, setRelated] = useState<PublicReportMatch[]>([])
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null)
  const [categories, setCategories] = useState<CategoryCount[]>([])
  const query = initialIdea.trim()
  const category = (initialCategory ?? '').trim()
  const browsing = query || category

  function search(event: FormEvent) {
    event.preventDefault()
    const next = idea.trim()
    router.push(next ? `/research?idea=${encodeURIComponent(next)}` : '/research')
  }

  function browseCategory(name: string) {
    router.push(`/research?category=${encodeURIComponent(name)}`)
  }

  const dashboardResearchHref = query ? `/dashboard/research?idea=${encodeURIComponent(query)}` : '/dashboard/research'
  const signupHref = `/signup?next=${encodeURIComponent(dashboardResearchHref)}`
  const loginHref = `/login?next=${encodeURIComponent(dashboardResearchHref)}`

  // Category chips are shown whenever the user hasn't started typing yet —
  // fetched once, real counts, no hardcoded list.
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/research/public-categories', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { categories: [] }))
      .then((payload) => setCategories(payload.categories ?? []))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setCategories([])
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    // Not browsing — the render branch below never reads `matches` in this
    // state, so there's nothing to reset (avoids a synchronous setState
    // inside the effect body for a value that's already inert).
    if (!query && !category) return
    if (query && query.length < 2) return

    const controller = new AbortController()
    const params = category ? `category=${encodeURIComponent(category)}` : `q=${encodeURIComponent(query)}`
    fetch(`/api/research/public-search?${params}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { results: [], related: [], suggestions: null }))
      .then((payload) => {
        setMatches(payload.results ?? [])
        setRelated(payload.related ?? [])
        setSuggestions(payload.suggestions ?? null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setMatches([])
        setRelated([])
        setSuggestions(null)
      })

    return () => controller.abort()
  }, [query, category])

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-12">
      <section className="max-w-3xl mx-auto text-center">
        <p className="font-mono text-xs font-bold tracking-[0.15em] uppercase text-[var(--color-mark-amber)] mb-5">Product intelligence for your first order</p>
        <h1 className="font-playfair text-4xl md:text-6xl font-black tracking-tight leading-[1.06] text-[var(--color-mark-ink)]">
          Research the product before you build the store.
        </h1>
        <p className="mt-6 font-inter text-base md:text-lg leading-relaxed text-[var(--color-mark-secondary)]">
          Start with an idea. LaunchGrid gives the market, supplier, cost, and margin questions one place to be answered.
        </p>
        <form onSubmit={search} className="mt-9 flex rounded-2xl border border-black/10 bg-white p-1.5 shadow-[0_12px_40px_rgba(26,26,24,0.08)] focus-within:border-[var(--color-mark-amber)]">
          <label htmlFor="research-idea" className="sr-only">Product idea to research</label>
          <input id="research-idea" value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="What product do you want to research?" className="min-w-0 flex-1 bg-transparent px-4 py-3 font-inter text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/70 focus:outline-none" />
          <button type="submit" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--color-mark-ink)] px-4 sm:px-5 font-inter text-sm font-bold text-white hover:bg-black active:scale-[0.98] transition-all">
            <Search className="w-4 h-4" /><span className="hidden sm:inline">Research</span>
          </button>
        </form>

        {!browsing && categories.length > 0 && (
          <div className="mt-8">
            <p className="font-inter text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-mark-secondary)] mb-4">Or browse by category</p>
            <div className="flex flex-wrap justify-center gap-2.5">
              {categories.map(({ category: name, count }) => {
                const Icon = iconFor(name)
                return (
                  <button
                    key={name}
                    onClick={() => browseCategory(name)}
                    className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 font-inter text-sm font-semibold text-[var(--color-mark-ink)] shadow-[0_2px_8px_rgba(26,26,24,0.04)] hover:border-[var(--color-mark-amber)] hover:shadow-[0_6px_20px_rgba(26,26,24,0.08)] transition-all"
                  >
                    <Icon className="w-4 h-4 text-[var(--color-mark-amber)]" />
                    {name}
                    <span className="text-[var(--color-mark-secondary)] font-normal">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {browsing ? (
        <section className="mt-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 border-b border-black/[0.08] pb-6">
            <div>
              <p className="font-inter text-sm font-semibold text-[var(--color-mark-secondary)]">{category ? 'Browsing category' : 'Research workspace'}</p>
              <h2 className="mt-1 font-playfair text-3xl md:text-4xl font-bold text-[var(--color-mark-ink)] flex items-center gap-3">
                {category || query}
                {category && (
                  <Link href="/research" className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1 font-inter text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]">
                    <X className="w-3 h-3" /> Clear
                  </Link>
                )}
              </h2>
            </div>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-3 py-2 font-inter text-xs font-bold ${matches.length > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
              {matches.length > 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleAlert className="w-3.5 h-3.5" />}
              {matches.length > 0
                ? `${matches.length} example report${matches.length === 1 ? '' : 's'} found`
                : related.length > 0
                  ? `${related.length} related report${related.length === 1 ? '' : 's'}`
                  : 'Not researched yet'}
            </span>
          </div>

          {matches.length > 0 ? (
            <>
              <section className="mt-7 grid md:grid-cols-2 gap-4">
                {matches.map((report) => (
                  <article key={report.slug} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 flex flex-col gap-4">
                    <div>
                      <p className="font-inter text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">Example report — not your data, and not counted against any plan</p>
                      <h3 className="mt-2 font-playfair text-xl font-bold text-[var(--color-mark-ink)]">{report.name}</h3>
                      <p className="mt-1 font-inter text-sm text-[var(--color-mark-secondary)]">
                        {report.category ?? 'Category not collected'} · {report.supplierCount} supplier{report.supplierCount === 1 ? '' : 's'} analysed
                        {report.score !== null ? ` · Decision score ${report.score.toFixed(0)}` : ''}
                      </p>
                      {report.recommendation && <p className="mt-2 font-inter text-xs text-emerald-800">{report.recommendation}</p>}
                    </div>
                    <Link href={`/signup?next=${encodeURIComponent(`/dashboard/research?idea=${encodeURIComponent(report.name)}`)}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-mark-ink)] px-5 py-3 font-inter text-sm font-bold text-white hover:bg-black active:scale-[0.98] transition-all">
                      Preview full report <ArrowRight className="w-4 h-4" />
                    </Link>
                  </article>
                ))}
              </section>

              <section className="mt-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-inter text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-mark-secondary)]">Report preview</p>
                    <h3 className="mt-1 font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">The evidence is ready to review.</h3>
                  </div>
                  <p className="font-inter text-xs text-[var(--color-mark-secondary)]">Verify your email to unlock your first {FREE_RESEARCH_LIMIT} full report{FREE_RESEARCH_LIMIT === 1 ? '' : 's'}.</p>
                </div>
                <div className="mt-4 grid md:grid-cols-3 gap-4">
                  {signals.map(({ label, detail, icon: Icon }) => (
                    <article key={label} className="rounded-2xl border border-black/[0.08] bg-white p-6">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-mark-subtle)] text-[var(--color-mark-secondary)]"><Icon className="w-5 h-5" /></span>
                      <h4 className="mt-6 font-inter text-base font-bold text-[var(--color-mark-ink)]">{label}</h4>
                      <p className="mt-2 font-inter text-sm leading-relaxed text-[var(--color-mark-secondary)]">{detail}</p>
                      <p className="mt-5 font-inter text-sm font-bold text-[var(--color-mark-ink)]">Available in full report</p>
                    </article>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* A miss must never be a dead end. Offer the exact thing the
                  merchant asked for first, then near-relevant reports, then
                  category browse — in that order of usefulness. */}
              <div className="mt-7 rounded-2xl border border-[var(--color-mark-amber)]/40 bg-amber-50/50 p-6">
                <h3 className="font-playfair text-2xl font-bold text-[var(--color-mark-ink)]">
                  We haven&rsquo;t researched &ldquo;{query}&rdquo; yet.
                </h3>
                <p className="mt-2 font-inter text-sm leading-relaxed text-[var(--color-mark-secondary)]">
                  Create a free account and we&rsquo;ll research it for you &mdash; real suppliers,
                  quoted prices and landed cost. Ready within about 6 hours, and you only
                  spend a credit if the report is usable.
                </p>
                <Link
                  href={`/signup?next=${encodeURIComponent(`/dashboard/research/requests?q=${encodeURIComponent(query)}`)}`}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-mark-ink)] px-5 py-3 font-inter text-sm font-bold text-white hover:bg-black active:scale-[0.98] transition-all"
                >
                  Research this for me <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {related.length > 0 && (
                <section className="mt-8">
                  <p className="font-inter text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-mark-secondary)]">
                    Related &mdash; not an exact match
                  </p>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {related.map((report) => (
                      <ReportCard key={report.slug} report={report} tone="neutral" />
                    ))}
                  </div>
                </section>
              )}

              {suggestions && suggestions.results.length > 0 && (
                <section className="mt-8">
                  <p className="font-inter text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-mark-secondary)]">
                    {suggestions.reason}
                  </p>
                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    {suggestions.results.map((report) => (
                      <ReportCard key={report.slug} report={report} tone="neutral" />
                    ))}
                  </div>
                  {suggestions.otherCategories.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {suggestions.otherCategories.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => browseCategory(name)}
                          className="rounded-full border border-black/10 bg-white px-4 py-2 font-inter text-sm font-semibold text-[var(--color-mark-ink)] hover:border-[var(--color-mark-amber)] transition-colors"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}

          <div className="mt-6 rounded-2xl border border-black/[0.08] bg-[var(--color-mark-subtle)] p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[var(--color-mark-amber)]"><CheckCircle2 className="w-4 h-4" /><p className="font-inter text-sm font-bold">See the rest with a free account</p></div>
              <p className="mt-2 font-inter text-sm leading-relaxed text-[var(--color-mark-secondary)]">Free accounts can complete {FREE_RESEARCH_LIMIT} product research report{FREE_RESEARCH_LIMIT === 1 ? '' : 's'} each month before a plan is required.</p>
            </div>
            <div className="flex shrink-0 flex-col sm:flex-row items-stretch gap-2">
              <Link href={signupHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-mark-ink)] px-5 py-3.5 font-inter text-sm font-bold text-white hover:bg-black active:scale-[0.98] transition-all">Create free account <ArrowRight className="w-4 h-4" /></Link>
              <Link href={loginHref} className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-3.5 font-inter text-sm font-bold text-[var(--color-mark-ink)] hover:bg-black/[0.03] transition-colors">Sign in</Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="mt-16 grid md:grid-cols-3 gap-7 border-t border-black/[0.08] pt-10">
          {signals.map(({ label, detail, icon: Icon }) => (
            <div key={label}>
              <Icon className="w-5 h-5 text-[var(--color-mark-amber)]" />
              <h2 className="mt-4 font-inter text-lg font-bold text-[var(--color-mark-ink)]">{label}</h2>
              <p className="mt-2 font-inter text-sm leading-relaxed text-[var(--color-mark-secondary)]">{detail}</p>
            </div>
          ))}
          <div className="md:col-span-3 mt-2 flex items-center gap-3 font-inter text-sm text-[var(--color-mark-secondary)]"><Store className="w-4 h-4 text-[var(--color-mark-amber)]" /> A validated idea can become a draft store product in one click.</div>
        </section>
      )}
    </div>
  )
}

/** One report tile. `tone` distinguishes a confident match from a related one so
 *  a near-miss is never styled as though it answered the search. */
function ReportCard({ report, tone }: { report: PublicReportMatch; tone: 'match' | 'neutral' }) {
  const shell =
    tone === 'match'
      ? 'border-emerald-200 bg-emerald-50/60'
      : 'border-black/[0.08] bg-white'
  return (
    <article className={`rounded-2xl border ${shell} p-6 flex flex-col gap-4`}>
      <div>
        <h3 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)]">{report.name}</h3>
        <p className="mt-1 font-inter text-sm text-[var(--color-mark-secondary)]">
          {report.category ?? 'Category not collected'} · {report.supplierCount} supplier{report.supplierCount === 1 ? '' : 's'} analysed
          {report.score !== null ? ` · Decision score ${report.score.toFixed(0)}` : ''}
        </p>
        {report.recommendation && (
          <p className="mt-2 font-inter text-xs text-[var(--color-mark-secondary)]">{report.recommendation}</p>
        )}
      </div>
      <Link
        href={`/signup?next=${encodeURIComponent(`/dashboard/research?idea=${encodeURIComponent(report.name)}`)}`}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 font-inter text-sm font-bold text-[var(--color-mark-ink)] hover:bg-black/[0.03] transition-colors"
      >
        Preview full report <ArrowRight className="w-4 h-4" />
      </Link>
    </article>
  )
}
