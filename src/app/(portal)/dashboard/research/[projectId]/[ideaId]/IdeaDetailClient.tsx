'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Rocket, ShieldCheck, TrendingUp, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  addSupplier,
  addPriceTier,
  scoreSupplier,
  runLandedCost,
  runProfitability,
  runOpportunityScore,
  promoteResearchToProduct,
  setComplianceEvidence,
  getResearchReport,
  type SupplierInput,
  type ResearchDataSource,
} from '@/actions/research'
import type { OpportunityComponents } from '@/lib/research/engines/opportunityScore'

type Report = NonNullable<Awaited<ReturnType<typeof getResearchReport>>>
type SupplierRow = Report['suppliers'][number]
type ProfitabilityRow = Report['profitability'][number]

const RECOMMENDATION_STYLE: Record<string, { label: string; className: string; emoji: string }> = {
  'Strong launch candidate': { label: 'Launch', className: 'bg-green-100 text-[var(--color-mark-green)]', emoji: '🚀' },
  'Order samples and validate': { label: 'Sample first', className: 'bg-blue-50 text-blue-700', emoji: '🧪' },
  'Negotiate or monitor': { label: 'Negotiate', className: 'bg-amber-50 text-[var(--color-mark-amber)]', emoji: '🤝' },
  'Weak opportunity': { label: 'Weak opportunity', className: 'bg-orange-50 text-orange-700', emoji: '⚠️' },
  Reject: { label: 'Reject', className: 'bg-red-50 text-[var(--color-mark-red)]', emoji: '✕' },
}

const READINESS_STATUS_STYLE: Record<string, { dot: string; bg: string; fg: string }> = {
  green: { dot: 'bg-[var(--color-mark-green)]', bg: 'bg-green-50', fg: 'text-[var(--color-mark-green)]' },
  amber: { dot: 'bg-[var(--color-mark-amber)]', bg: 'bg-amber-50', fg: 'text-[var(--color-mark-amber)]' },
  red: { dot: 'bg-[var(--color-mark-red)]', bg: 'bg-red-50', fg: 'text-[var(--color-mark-red)]' },
}

// Only genuinely subjective dimensions stay manual — everything else below
// is derived from real stored data at compute time (see deriveAutoComponents).
const MANUAL_COMPONENT_FIELDS: { key: keyof OpportunityComponents; label: string; help: string }[] = [
  { key: 'demandScore', label: 'Demand', help: 'From search trends/listing volume you\'ve seen — 0 = no evidence, 100 = strong' },
  { key: 'competitionGapScore', label: 'Competition gap', help: 'Higher = less crowded / bigger gap' },
  { key: 'improvementOpportunityScore', label: 'Differentiation', help: 'From review complaint clusters you\'ve read — how fixable is the market\'s biggest complaint?' },
  { key: 'returnRiskScore', label: 'Return risk', help: 'Higher = lower expected return rate' },
  { key: 'shippingSuitabilityScore', label: 'Shipping suitability', help: 'Higher = better shipping economics (light, not fragile)' },
]

/** Derives the 6 data-backed components from whatever's already stored. Falls back to a neutral 50 only when truly nothing is known yet. */
function deriveAutoComponents(report: Report): { values: Partial<OpportunityComponents>; sources: Record<string, string> } {
  const values: Partial<OpportunityComponents> = {}
  const sources: Record<string, string> = {}

  const expectedProfitability = report.profitability.find((p) => p.scenario_type === 'expected')
  if (expectedProfitability) {
    const marginPct = expectedProfitability.outputs_json.contributionMarginPct as number
    values.marginScore = Math.max(0, Math.min(100, Math.round((marginPct / 0.4) * 100)))
    sources.marginScore = `${(marginPct * 100).toFixed(1)}% contribution margin (expected scenario)`
  } else {
    values.marginScore = 50
    sources.marginScore = 'No profitability run yet — neutral default'
  }

  const supplierScore = report.suppliers[0]?.research_supplier_scores?.[0]
  if (supplierScore) {
    values.manufacturerConfidenceScore = supplierScore.manufacturer_confidence_score
    sources.manufacturerConfidenceScore = `Scored supplier: ${supplierScore.manufacturer_confidence_label}`
    values.qualityScore = supplierScore.quality_score ?? 50
    sources.qualityScore = supplierScore.quality_label ? `Scored supplier: ${supplierScore.quality_label}` : 'No quality score yet'
  } else {
    values.manufacturerConfidenceScore = 50
    values.qualityScore = 50
    sources.manufacturerConfidenceScore = 'Supplier not scored yet — neutral default'
    sources.qualityScore = 'Supplier not scored yet — neutral default'
  }

  const landedCost = report.landedCosts[0]?.outputs_json as { readyToSellCostPerUnit: number } | undefined
  const supplierMoq = report.suppliers[0]?.moq ?? null
  const maxInvestment = report.idea.max_initial_investment
  if (landedCost && supplierMoq != null && maxInvestment) {
    const moqInvestment = supplierMoq * landedCost.readyToSellCostPerUnit
    values.moqSuitabilityScore = moqInvestment <= maxInvestment ? 90 : moqInvestment <= maxInvestment * 2 ? 55 : 20
    values.capitalScore = values.moqSuitabilityScore
    sources.moqSuitabilityScore = `MOQ of ${supplierMoq} units ≈ ₹${moqInvestment.toFixed(0)} vs your ₹${maxInvestment} budget`
    sources.capitalScore = sources.moqSuitabilityScore
  } else {
    values.moqSuitabilityScore = 50
    values.capitalScore = 50
    sources.moqSuitabilityScore = 'Set a max first-order budget and run landed cost to compute this'
    sources.capitalScore = sources.moqSuitabilityScore
  }

  values.complianceScore = report.idea.has_compliance_evidence ? 85 : 35
  sources.complianceScore = report.idea.has_compliance_evidence ? 'Compliance evidence marked reviewed' : 'Compliance evidence not yet reviewed'

  return { values, sources }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-black/5 rounded-[1.5rem] p-6 shadow-sm space-y-4">
      <h2 className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">{title}</h2>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Data provenance (migration 0032). A price or supplier that was SCRAPED from a
// real page, TYPED by the merchant, or SEEDED as demo filler used to look
// identical in this report. These markers make the difference visible wherever
// a number is shown.
// ---------------------------------------------------------------------------

const PROVENANCE_STYLE: Record<ResearchDataSource, { label: string; className: string }> = {
  scraped: { label: 'Scraped', className: 'bg-green-50 text-[var(--color-mark-green)]' },
  manual: { label: 'You entered this', className: 'bg-[var(--color-mark-base)] text-[var(--color-mark-secondary)]' },
  seeded: { label: 'Demo data — not real supplier evidence', className: 'bg-amber-50 text-[var(--color-mark-amber)]' },
  unknown: { label: 'Source unknown', className: 'bg-black/[0.04] text-[var(--color-mark-secondary)]' },
}

function sourceDomain(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

const LOW_CONFIDENCE_THRESHOLD = 0.6

function ProvenanceBadge({
  dataSource,
  extractionConfidence,
  sourceUrl,
}: {
  dataSource: ResearchDataSource | null
  extractionConfidence?: number | null
  sourceUrl?: string | null
}) {
  const source: ResearchDataSource = dataSource ?? 'unknown'
  const style = PROVENANCE_STYLE[source] ?? PROVENANCE_STYLE.unknown
  const domain = source === 'scraped' ? sourceDomain(sourceUrl ?? null) : null
  const confidence = extractionConfidence == null ? null : Number(extractionConfidence)
  const lowConfidence = source === 'scraped' && confidence != null && confidence < LOW_CONFIDENCE_THRESHOLD

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.className}`}>
        {source === 'seeded' && <AlertTriangle className="w-3 h-3" />}
        {style.label}
        {domain && <span className="normal-case tracking-normal opacity-80">· {domain}</span>}
      </span>
      {lowConfidence && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-mark-amber)]">
          <AlertTriangle className="w-3 h-3" /> Low confidence extraction
        </span>
      )}
    </span>
  )
}

/** Top-of-report warning shown when the idea itself is demo filler. */
function SeededReportBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-mark-amber)] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Demo data
          </p>
          <p className="text-sm font-semibold text-[var(--color-mark-ink)]">
            This report is built entirely on seeded demo inputs.
          </p>
          <p className="text-sm text-[var(--color-mark-secondary)] leading-relaxed">
            The suppliers, prices and scores below are sample filler, not real supplier evidence. Do not use this
            report to make a real purchasing decision — add your own suppliers and price tiers first.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs font-bold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] shrink-0"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

/**
 * Free-plan teaser: shows the SHAPE of the decision cockpit (verdict banner,
 * readiness matrix, recommended order) blurred, so a free user can see what
 * upgrading unlocks without the platform disclosing real supplier/margin
 * numbers as free-tier content. The underlying data entry (suppliers, price
 * tiers, landed cost, profitability) stays fully usable on free — only the
 * synthesized verdict is gated.
 */
function LockedReportPreview({ recStyle }: { recStyle: { className: string; emoji: string } }) {
  return (
    <div className="relative">
      <div aria-hidden className="space-y-4 blur-sm pointer-events-none select-none opacity-70">
        <div className={`rounded-[1.5rem] p-6 border ${recStyle.className} border-transparent`}>
          <p className="text-2xl font-extrabold">{recStyle.emoji} Launch verdict</p>
          <p className="text-sm font-semibold mt-1 opacity-80">Score 00 / 100 · range 00–00 · confidence level</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-3 bg-black/5 h-16" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl p-3 bg-black/5 h-14" />
          ))}
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border border-black/10 rounded-2xl shadow-lg px-6 py-5 text-center max-w-sm mx-4">
          <p className="text-sm font-bold text-[var(--color-mark-ink)]">Your launch verdict is ready</p>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-1.5 leading-relaxed">
            Margin, launch readiness, recommended order size, and sourcing-route comparison — upgrade to see the full decision, not just the raw numbers you entered.
          </p>
          <Link href="/pricing" className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold px-5 py-2.5 hover:opacity-90 transition-opacity">
            Upgrade to unlock <Rocket className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 px-3 rounded-lg border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 w-full"
    />
  )
}

export function IdeaDetailClient({ projectId, ideaId, initialReport, isPaidPlan }: { projectId: string; ideaId: string; initialReport: Report; isPaidPlan: boolean }) {
  const [report, setReport] = useState(initialReport)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [seededBannerDismissed, setSeededBannerDismissed] = useState(false)

  const [supplierForm, setSupplierForm] = useState<Partial<SupplierInput>>({ currency: 'INR' })
  const [tierForSupplier, setTierForSupplier] = useState<string>('')
  const [tierQty, setTierQty] = useState('')
  const [tierPrice, setTierPrice] = useState('')
  const [tierCurrency, setTierCurrency] = useState('INR')
  const [lcSupplier, setLcSupplier] = useState('')
  const [lcQty, setLcQty] = useState('500')
  const [manualComponents, setManualComponents] = useState<Record<string, number>>(
    Object.fromEntries(MANUAL_COMPONENT_FIELDS.map((f) => [f.key, 50])),
  )

  async function refresh() {
    const next = await getResearchReport(ideaId)
    if (next) setReport(next)
  }

  function handleAddSupplier() {
    setError(null)
    if (!supplierForm.supplierName) return setError('Supplier name is required')
    startTransition(async () => {
      const result = await addSupplier(ideaId, supplierForm as SupplierInput)
      if (result.error) return setError(result.error)
      setSupplierForm({ currency: 'USD' })
      await refresh()
    })
  }

  function handleAddTier() {
    setError(null)
    if (!tierForSupplier || !tierQty || !tierPrice) return setError('Pick a supplier, quantity, and price')
    startTransition(async () => {
      const result = await addPriceTier(tierForSupplier, { quantity: Number(tierQty), unitPrice: Number(tierPrice), currency: tierCurrency })
      if (result.error) return setError(result.error)
      setTierQty('')
      setTierPrice('')
      setNotice(`Price tier saved: ${tierQty} units @ ${tierCurrency} ${tierPrice}`)
      await refresh()
    })
  }

  function handleScoreSupplier(supplierId: string) {
    startTransition(async () => {
      const result = await scoreSupplier(supplierId)
      if (result.error) return setError(result.error)
      await refresh()
    })
  }

  function handleLandedCost() {
    setError(null)
    if (!lcSupplier) return setError('Pick a supplier to calculate landed cost for')
    startTransition(async () => {
      const result = await runLandedCost({ productIdeaId: ideaId, supplierId: lcSupplier, quantity: Number(lcQty) || 500 })
      if (result.error) return setError(result.error)
      await refresh()
    })
  }

  function handleProfitability() {
    setError(null)
    const lc = report.landedCosts[0]
    if (!lc) return setError('Run landed cost first')
    if (!report.idea.target_retail_price) return setError('Set a target retail price on this product idea first')
    startTransition(async () => {
      const outputs = lc.outputs_json as { readyToSellCostPerUnit: number }
      const result = await runProfitability({
        productIdeaId: ideaId,
        channel: 'amazon_in',
        landedCostScenarioId: lc.id,
        readyToSellCostPerUnit: outputs.readyToSellCostPerUnit,
        listingPrice: report.idea.target_retail_price,
      })
      if (result.error) return setError(result.error)
      await refresh()
    })
  }

  function handleOpportunityScore() {
    setError(null)
    startTransition(async () => {
      const auto = deriveAutoComponents(report)
      const result = await runOpportunityScore({
        productIdeaId: ideaId,
        supplierId: report.suppliers[0]?.id,
        components: { ...auto.values, ...manualComponents } as unknown as OpportunityComponents,
      })
      if (result.error) return setError(result.error)
      await refresh()
    })
  }

  function handleToggleCompliance(checked: boolean) {
    startTransition(async () => {
      const result = await setComplianceEvidence(ideaId, checked)
      if (result.error) return setError(result.error)
      await refresh()
    })
  }

  function handleBuildStore() {
    setError(null)
    setNotice(null)
    startTransition(async () => {
      const result = await promoteResearchToProduct(ideaId)
      if (result.error) return setError(result.error)
      setNotice('Draft product created — review it in Products before publishing.')
      await refresh()
    })
  }

  const os = report.opportunityScore
  const recStyle = os ? RECOMMENDATION_STYLE[os.recommendation as string] : null
  const canBuildStore = report.idea.status === 'launch_ready' || report.idea.status === 'promoted'
  const dc = report.decisionCockpit
  const auto = deriveAutoComponents(report)
  // A verdict is only as good as its inputs: with no scraped supplier attached,
  // everything below rests on self-entered or demo numbers.
  const hasScrapedSupplier = report.suppliers.some((s: SupplierRow) => s.data_source === 'scraped')
  const showSeededBanner = report.ideaDataSource === 'seeded' && !seededBannerDismissed

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      {showSeededBanner && <SeededReportBanner onDismiss={() => setSeededBannerDismissed(true)} />}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link href={`/dashboard/research/${projectId}`} className="text-xs font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]">
            ← Product ideas
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-mark-ink)] tracking-tight mt-2">{report.idea.name}</h1>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--color-mark-secondary)] bg-white border border-black/5 rounded-xl px-3 py-2">
          <input type="checkbox" checked={report.idea.has_compliance_evidence} onChange={(e) => handleToggleCompliance(e.target.checked)} />
          Compliance evidence reviewed
        </label>
      </div>

      {error && <div className="rounded-xl bg-red-50 text-[var(--color-mark-red)] text-sm font-medium px-4 py-3">{error}</div>}
      {notice && <div className="rounded-xl bg-green-50 text-[var(--color-mark-green)] text-sm font-medium px-4 py-3">{notice}</div>}

      {os && recStyle && dc && !isPaidPlan && <LockedReportPreview recStyle={recStyle} />}

      {os && recStyle && dc && isPaidPlan && (
        <div className="space-y-4">
          <div className={`rounded-[1.5rem] p-6 border ${recStyle.className} border-transparent`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-2xl font-extrabold flex items-center gap-2">
                  {recStyle.emoji} {dc.verdict.primaryDecision}
                </p>
                <p className="text-sm font-semibold mt-1 opacity-80">
                  Score {Number(os.score).toFixed(0)} / 100 · range {dc.decisionConfidence.lowScore.toFixed(0)}–{dc.decisionConfidence.highScore.toFixed(0)} · {dc.decisionConfidence.confidence.toLowerCase()} confidence
                </p>
              </div>
              {canBuildStore && (
                <button
                  onClick={handleBuildStore}
                  disabled={isPending}
                  className="h-11 px-5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  <Rocket className="w-4 h-4" /> Build my store
                </button>
              )}
            </div>
            <p className="text-sm mt-3 opacity-90">{dc.verdict.explanation}</p>
            {!hasScrapedSupplier && (
              <p className="text-xs font-semibold mt-2 opacity-75">
                No supplier on this idea has verified scraped evidence — this verdict rests on self-entered or demo inputs.
              </p>
            )}
          </div>

          {dc.blockers.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5 space-y-2">
              <p className="text-sm font-bold text-[var(--color-mark-red)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {dc.blockers.length} launch blocker{dc.blockers.length > 1 ? 's' : ''}
              </p>
              <ul className="text-sm text-[var(--color-mark-red)]/90 space-y-1 list-disc list-inside">
                {dc.blockers.map((b) => (
                  <li key={b.dimension}>{b.action}</li>
                ))}
              </ul>
            </div>
          )}

          <Section title="Launch readiness">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {dc.readinessMatrix.map((r) => {
                const style = READINESS_STATUS_STYLE[r.status]
                return (
                  <div key={r.key} className={`rounded-xl p-3 ${style.bg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                      <span className={`text-sm font-bold ${style.fg}`}>{r.label}</span>
                    </div>
                    <p className={`text-xs mt-1 ${style.fg} opacity-80`}>{r.meaning}</p>
                  </div>
                )
              })}
            </div>
          </Section>

          <Section title="Recommended first order">
            {dc.recommendedOrder.recommendedTestQty == null ? (
              <p className="text-sm text-[var(--color-mark-secondary)]">Run a landed-cost calculation to see a recommended order size.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-xs text-[var(--color-mark-secondary)] font-bold uppercase">Recommended qty</p><p className="font-bold text-[var(--color-mark-ink)]">{dc.recommendedOrder.recommendedTestQty} units</p></div>
                <div><p className="text-xs text-[var(--color-mark-secondary)] font-bold uppercase">Supplier MOQ</p><p className="font-bold text-[var(--color-mark-ink)]">{dc.recommendedOrder.supplierMoq ?? '—'}</p></div>
                <div><p className="text-xs text-[var(--color-mark-secondary)] font-bold uppercase">Est. investment</p><p className="font-bold text-[var(--color-mark-ink)]">₹{dc.recommendedOrder.maxSafeInvestment?.toFixed(0)}</p></div>
                <div><p className="text-xs text-[var(--color-mark-secondary)] font-bold uppercase">Inventory risk</p><p className="font-bold text-[var(--color-mark-ink)]">{dc.recommendedOrder.inventoryRisk ?? '—'}</p></div>
              </div>
            )}
          </Section>

          <Section title="What could change this decision">
            <div className="space-y-2">
              {dc.decisionConfidence.contributors.map((c) => (
                <div key={c.code} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-[var(--color-mark-ink)] font-medium">{c.label}</span>
                  <span className="text-xs text-[var(--color-mark-secondary)]">±{Math.max(c.downsidePoints, c.upsidePoints).toFixed(1)} pts · {c.researchTask}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}

      {report.sourcingScenarios && isPaidPlan && (
        <Section title="Sourcing-route scenarios — where and how much to order">
          <p className="text-xs text-[var(--color-mark-secondary)]">
            Recommendation is optimized for contribution margin and growth potential, not lowest risk. Check the launch
            readiness matrix above for any open compliance/quality flags before committing capital.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs font-bold uppercase text-[var(--color-mark-secondary)] border-b border-black/5">
                  <th className="py-2 pr-3">Route</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Cash required</th>
                  <th className="py-2 pr-3">Contribution/unit</th>
                  <th className="py-2 pr-3">Margin</th>
                  <th className="py-2">Risk</th>
                </tr>
              </thead>
              <tbody>
                {report.sourcingScenarios.scenarios.map((s) => (
                  <tr
                    key={s.route}
                    className={`border-b border-black/5 last:border-0 ${s.route === report.sourcingScenarios!.verdict.recommendedRoute ? 'bg-[var(--accent-muted)]' : ''}`}
                  >
                    <td className="py-2 pr-3 font-bold text-[var(--color-mark-ink)]">
                      {s.route}
                      {s.route === report.sourcingScenarios!.verdict.recommendedRoute && <span className="ml-2 text-[10px] font-bold uppercase text-[var(--accent-primary)]">Recommended</span>}
                    </td>
                    <td className="py-2 pr-3">{s.quantity.toLocaleString()}</td>
                    <td className="py-2 pr-3">₹{s.totalCashRequired.toFixed(0)}</td>
                    <td className="py-2 pr-3">{s.contributionPerUnit != null ? `₹${s.contributionPerUnit.toFixed(2)}` : '—'}</td>
                    <td className="py-2 pr-3">{s.contributionMarginPct != null ? `${(s.contributionMarginPct * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-2">{s.risk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-[var(--color-mark-base)] px-4 py-3 text-sm">
            <span className="font-bold text-[var(--color-mark-ink)]">Recommendation: </span>
            <span className="text-[var(--color-mark-secondary)]">{report.sourcingScenarios.verdict.reason}</span>
          </div>
        </Section>
      )}

      <Section title="Suppliers">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <TextInput placeholder="Supplier name" value={supplierForm.supplierName ?? ''} onChange={(e) => setSupplierForm((s) => ({ ...s, supplierName: e.target.value }))} />
          <TextInput placeholder="Platform (Alibaba, IndiaMART...)" value={supplierForm.platform ?? ''} onChange={(e) => setSupplierForm((s) => ({ ...s, platform: e.target.value }))} />
          <TextInput placeholder="Country (e.g. India, China)" value={supplierForm.country ?? ''} onChange={(e) => setSupplierForm((s) => ({ ...s, country: e.target.value }))} />
          <TextInput placeholder="MOQ" type="number" value={supplierForm.moq ?? ''} onChange={(e) => setSupplierForm((s) => ({ ...s, moq: Number(e.target.value) }))} />
          <TextInput placeholder="Store URL" value={supplierForm.storeUrl ?? ''} onChange={(e) => setSupplierForm((s) => ({ ...s, storeUrl: e.target.value }))} />
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-medium text-[var(--color-mark-secondary)]">
          {[
            ['auditReportAvailable', 'Factory audit available'],
            ['businessLicenceAvailable', 'Business licence supports mfg'],
            ['factoryAddressDisclosed', 'Factory address disclosed'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={!!(supplierForm as Record<string, boolean>)[key]}
                onChange={(e) => setSupplierForm((s) => ({ ...s, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <button onClick={handleAddSupplier} disabled={isPending} className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold flex items-center gap-2 w-fit disabled:opacity-40">
          <Plus className="w-4 h-4" /> Add supplier
        </button>

        {report.suppliers.length > 0 && (
          <div className="space-y-3 pt-2">
            {report.suppliers.map((s: SupplierRow) => (
              <div key={s.id} className="p-4 rounded-xl border border-black/5 bg-[var(--color-mark-base)]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-mark-ink)]">{s.supplier_name}</p>
                    <p className="text-xs text-[var(--color-mark-secondary)]">
                      {s.platform ?? 'Unknown platform'} · MOQ {s.moq ?? '—'}
                      {s.research_supplier_scores?.[0] && ` · Confidence ${s.research_supplier_scores[0].manufacturer_confidence_label}`}
                    </p>
                    <div className="mt-2">
                      <ProvenanceBadge dataSource={s.data_source} extractionConfidence={s.extraction_confidence} sourceUrl={s.source_url} />
                    </div>
                  </div>
                  {!s.research_supplier_scores?.length && (
                    <button onClick={() => handleScoreSupplier(s.id)} className="text-xs font-bold text-[var(--accent-primary)] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Score supplier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Price tiers">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <select value={tierForSupplier} onChange={(e) => setTierForSupplier(e.target.value)} className="h-10 px-3 rounded-lg border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium">
            <option value="">Select supplier</option>
            {report.suppliers.map((s: SupplierRow) => (
              <option key={s.id} value={s.id}>{s.supplier_name}</option>
            ))}
          </select>
          <TextInput placeholder="Quantity" type="number" value={tierQty} onChange={(e) => setTierQty(e.target.value)} />
          <TextInput placeholder="Unit price" type="number" value={tierPrice} onChange={(e) => setTierPrice(e.target.value)} />
          <select
            value={tierCurrency}
            onChange={(e) => setTierCurrency(e.target.value)}
            aria-label="Tier currency"
            className="h-10 px-3 rounded-lg border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="CNY">¥ CNY</option>
          </select>
          <button onClick={handleAddTier} disabled={isPending} className="h-10 px-4 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold disabled:opacity-40">
            Add tier
          </button>
        </div>

        {/* Saved tiers were previously invisible — merchants had no way to confirm, review or
            remove what they had entered, which also hid currency mistakes. */}
        {report.suppliers.some((s: SupplierRow) => (s.research_price_tiers?.length ?? 0) > 0) ? (
          <div className="mt-4 space-y-3">
            {report.suppliers.map((s: SupplierRow) =>
              (s.research_price_tiers?.length ?? 0) === 0 ? null : (
                <div key={s.id} className="rounded-xl border border-black/10 overflow-hidden">
                  <div className="px-3 py-2 bg-black/[0.03] text-xs font-bold uppercase tracking-wider text-[var(--color-mark-secondary)]">
                    {s.supplier_name}
                  </div>
                  <ul className="divide-y divide-black/5">
                    {[...(s.research_price_tiers ?? [])]
                      .sort((a, b) => a.quantity - b.quantity)
                      .map((t, i) => (
                        <li key={i} className="px-3 py-2 flex items-center justify-between gap-3 text-sm flex-wrap">
                          <span className="text-[var(--color-mark-secondary)] flex items-center gap-2 flex-wrap">
                            {t.quantity.toLocaleString('en-IN')}+ units
                            <ProvenanceBadge dataSource={t.data_source} extractionConfidence={t.extraction_confidence} sourceUrl={t.source_url} />
                          </span>
                          <span className="font-bold tabular-nums text-[var(--color-mark-ink)]">
                            {t.currency === 'INR' ? '₹' : t.currency === 'USD' ? '$' : t.currency === 'CNY' ? '¥' : ''}
                            {Number(t.unit_price).toLocaleString('en-IN')} / unit
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-[var(--color-mark-secondary)]">
            No price tiers yet — add one above so landed cost has a unit price to work from.
          </p>
        )}
      </Section>

      <Section title="Landed cost">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <select value={lcSupplier} onChange={(e) => setLcSupplier(e.target.value)} className="h-10 px-3 rounded-lg border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium">
            <option value="">Select supplier</option>
            {report.suppliers.map((s: SupplierRow) => (
              <option key={s.id} value={s.id}>{s.supplier_name}</option>
            ))}
          </select>
          <TextInput placeholder="Order quantity" type="number" value={lcQty} onChange={(e) => setLcQty(e.target.value)} />
          <button onClick={handleLandedCost} disabled={isPending} className="h-10 px-4 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold disabled:opacity-40">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calculate landed cost'}
          </button>
        </div>
        {report.landedCosts[0] && (
          <p className="text-sm font-semibold text-[var(--color-mark-ink)]">
            Ready-to-sell cost: ₹{(report.landedCosts[0].outputs_json as { readyToSellCostPerUnit: number }).readyToSellCostPerUnit.toFixed(2)} / unit
          </p>
        )}
      </Section>

      <Section title="Profitability">
        <button onClick={handleProfitability} disabled={isPending} className="h-10 px-4 rounded-xl bg-[var(--color-mark-ink)] text-white text-sm font-bold flex items-center gap-2 w-fit disabled:opacity-40">
          <TrendingUp className="w-4 h-4" /> Run profitability (Amazon.in, expected scenario)
        </button>
        {report.profitability.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
            {report.profitability.map((p: ProfitabilityRow) => (
              <div key={p.id} className="p-3 rounded-xl border border-black/5 bg-[var(--color-mark-base)]">
                <p className="text-xs font-bold uppercase text-[var(--color-mark-secondary)]">{p.scenario_type}</p>
                <p className="text-sm font-bold text-[var(--color-mark-ink)] mt-1">
                  Contribution: ₹{p.outputs_json.contributionPerOrder?.toFixed(2)} ({(p.outputs_json.contributionMarginPct * 100).toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Opportunity score & verdict">
        <div className="space-y-2">
          <p className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wide">Computed automatically from your data above</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(auto.values).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-[var(--color-mark-base)] px-3 py-2">
                <p className="font-bold text-[var(--color-mark-ink)] flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-[var(--color-mark-green)]" /> {value}/100</p>
                <p className="text-[var(--color-mark-secondary)] mt-0.5">{auto.sources[key]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-black/5">
          <p className="text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wide">Your judgment — no data source yet for these</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MANUAL_COMPONENT_FIELDS.map((f) => (
              <label key={f.key} className="text-xs font-semibold text-[var(--color-mark-secondary)] space-y-1 block" title={f.help}>
                {f.label}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={manualComponents[f.key]}
                  onChange={(e) => {
                    // These are 0-100 scores. min/max alone don't stop a typed "999",
                    // which would otherwise skew the weighted verdict.
                    const n = Number(e.target.value)
                    const clamped = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
                    setManualComponents((c) => ({ ...c, [f.key]: clamped }))
                  }}
                  className="h-9 px-3 rounded-lg border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] w-full"
                />
              </label>
            ))}
          </div>
        </div>
        <button onClick={handleOpportunityScore} disabled={isPending} className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold flex items-center gap-2 w-fit disabled:opacity-40">
          <Sparkles className="w-4 h-4" /> Compute verdict
        </button>
      </Section>
    </div>
  )
}
