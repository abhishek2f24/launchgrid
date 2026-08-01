import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getWorkspace } from '@/actions/investigation'
import { REQUIRED_PREDICATES, type Section } from '@/lib/intelligence/investigation'
import EvidenceField from './EvidenceField'
import DecisionForm from './DecisionForm'

export const dynamic = 'force-dynamic'

const SECTIONS: { key: Section; title: string; note: string }[] = [
  { key: 'market', title: '1 · Market evidence', note: 'From Google Trends. Relative interest, not sales volume.' },
  { key: 'marketplace', title: '2 · Marketplace evidence', note: 'Manual for now — open Amazon.in and record what you actually see.' },
  { key: 'supplier', title: '3 · Supplier evidence', note: 'One RFQ to three suppliers answers most of this.' },
  { key: 'financial', title: '4 · Financial model', note: 'Nothing is assumed. A blank stays blank rather than becoming a default.' },
  { key: 'customer', title: '5 · Customer evidence', note: 'Read the 1- and 2-star reviews. This is where differentiation comes from.' },
]

const VERDICT_STYLE: Record<string, string> = {
  BUY: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  WAIT: 'border-amber-300 bg-amber-50 text-amber-900',
  REJECT: 'border-red-300 bg-red-50 text-red-900',
}

const money = (n: number | null) =>
  n === null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getWorkspace(id)
  if (!data) notFound()

  const { investigation, verdict, claims, tasks } = data
  const f = verdict.financials
  const coveragePct = Math.round(verdict.evidenceCoverage * 100)

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <div>
        <Link href="/dashboard/investigate" className="text-xs text-neutral-500 hover:text-neutral-900">
          ← All investigations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          {investigation.product_name}
        </h1>
        <p className="text-sm text-neutral-600 tabular-nums">
          Budget ₹{Number(investigation.budget_inr).toLocaleString('en-IN')}
        </p>
      </div>

      {/* ---- verdict ---- */}
      <section className={`rounded-xl border p-5 ${VERDICT_STYLE[verdict.verdict]}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <span className="text-3xl font-bold tracking-tight">{verdict.verdict}</span>
          <span className="text-sm font-semibold tabular-nums">
            Evidence coverage {coveragePct}%
          </span>
        </div>

        {verdict.because.length > 0 && (
          <ul className="mt-4 flex list-disc flex-col gap-1.5 pl-5 text-sm">
            {verdict.because.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}

        {verdict.wouldBecomeBuyIf && (
          <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm font-medium">
            {verdict.wouldBecomeBuyIf}
          </p>
        )}
        {verdict.wouldBecomeRejectIf && (
          <p className="mt-4 rounded-lg bg-white/70 p-3 text-sm">
            <strong>Becomes a REJECT if:</strong> {verdict.wouldBecomeRejectIf}
          </p>
        )}
      </section>

      {/* ---- contradictions ---- */}
      {verdict.contradictions.length > 0 && (
        <section className="rounded-xl border border-orange-300 bg-orange-50 p-5">
          <h2 className="text-sm font-semibold text-orange-900">Sources disagree</h2>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-orange-900">
            {verdict.contradictions.map((c, i) => (
              <li key={i}><strong>{c.predicate}:</strong> {c.detail}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-orange-800">
            Not averaged — a mean of two disagreeing sources describes neither.
          </p>
        </section>
      )}

      {/* ---- financial model ---- */}
      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Unit economics</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          {[
            ['Landed cost / unit', money(f.landedCostPerUnit)],
            ['Contribution / unit', money(f.contributionPerUnit)],
            ['Margin', f.contributionMarginPct === null ? '—' : `${(f.contributionMarginPct * 100).toFixed(1)}%`],
            ['First order', f.firstOrderUnits === null ? '—' : `${f.firstOrderUnits} units`],
            ['Working capital', money(f.workingCapital)],
            ['Break-even', f.breakEvenUnits === null ? '—' : `${f.breakEvenUnits} units`],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dt className="text-xs text-neutral-500">{label}</dt>
              <dd className="text-base font-semibold tabular-nums text-neutral-900">{value}</dd>
            </div>
          ))}
        </dl>
        {f.missing.length > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            Shown as — because these are still unknown: {f.missing.join(', ')}. Nothing is assumed in their place.
          </p>
        )}
      </section>

      {/* ---- unknowns ---- */}
      {verdict.unknowns.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">
            Unknowns blocking the decision ({verdict.unknowns.filter((u) => u.blocksBuy).length} blocking)
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {verdict.unknowns.map((u) => (
              <li key={u.predicate} className="flex flex-wrap items-center gap-2 text-sm">
                {u.blocksBuy && (
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-800">
                    blocks buy
                  </span>
                )}
                <span className="text-neutral-800">{u.label}</span>
                <span className="text-xs text-neutral-500">— {u.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- tasks ---- */}
      {tasks.length > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Next actions</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Cheapest first, blocking questions before the rest. Every completed action raises coverage.
          </p>
          <ol className="mt-3 flex flex-col gap-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline gap-2 rounded-lg bg-neutral-50 p-3 text-sm">
                <span className="text-neutral-900">{t.action}</span>
                <span className="ml-auto whitespace-nowrap text-xs text-neutral-500 tabular-nums">
                  {Number(t.cost_inr) === 0 ? 'free' : money(Number(t.cost_inr))} · {t.effort}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---- evidence sections ---- */}
      {SECTIONS.map((section) => (
        <section key={section.key} className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-neutral-900">{section.title}</h2>
          <p className="mt-1 text-xs text-neutral-500">{section.note}</p>
          <div className="mt-2">
            {REQUIRED_PREDICATES.filter((s) => s.section === section.key).map((spec) => {
              const claim = claims[spec.predicate]
              return (
                <EvidenceField
                  key={spec.predicate}
                  investigationId={investigation.id}
                  predicate={spec.predicate}
                  label={spec.label}
                  unit={spec.unit}
                  current={claim?.value ?? null}
                  confidence={claim?.confidence ?? 0}
                  method={claim?.value !== null ? 'user' : undefined}
                />
              )
            })}
          </div>
        </section>
      ))}

      {/* ---- decision ---- */}
      <section className="rounded-xl border border-neutral-900 bg-white p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Record your decision</h2>
        <p className="mt-1 mb-3 text-xs text-neutral-500">
          The engine&rsquo;s verdict is <strong>{verdict.verdict}</strong> at {coveragePct}% coverage.
          You can disagree — but write down why.
        </p>
        <DecisionForm investigationId={investigation.id} current={investigation.decision} />
      </section>
    </div>
  )
}
