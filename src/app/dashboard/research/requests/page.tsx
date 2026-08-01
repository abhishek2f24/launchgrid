import Link from 'next/link'
import { getResearchCreditBalance, listResearchRequests } from '@/actions/researchCredits'
import { CREDIT_PACKS, rupees } from '@/lib/research/creditPacks'
import RequestForm from './RequestForm'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-neutral-100 text-neutral-700',
  running: 'bg-blue-50 text-blue-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  refunded: 'bg-amber-50 text-amber-800',
  failed: 'bg-red-50 text-red-700',
}

// Deliberately plain language: "refunded" is the customer-visible truth, and the
// reason is shown rather than hidden, because a silent refund reads as a bug.
const STATUS_LABEL: Record<string, string> = {
  queued: 'Queued',
  running: 'Researching',
  delivered: 'Ready',
  refunded: 'Credit returned',
  failed: 'Failed',
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default async function ResearchRequestsPage() {
  const [balance, requests] = await Promise.all([
    getResearchCreditBalance(),
    listResearchRequests(),
  ])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Research any product
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600">
          Ask for any product, even one we haven&rsquo;t covered. We source real supplier
          listings and build the full decision report. One credit per report — and if we
          can&rsquo;t build one worth reading, the credit goes straight back.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-neutral-900">{balance}</span>
            <span className="text-sm text-neutral-600">
              {balance === 1 ? 'credit' : 'credits'} left on this account
            </span>
          </div>
          <Link
            href="/dashboard/billing/credits"
            className="text-sm font-medium text-neutral-900 underline underline-offset-4"
          >
            Buy more
          </Link>
        </div>
        <RequestForm balance={balance} />
      </section>

      {balance < 1 && (
        <section className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Credit packs</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={`rounded-lg border bg-white p-4 ${
                  pack.popular ? 'border-neutral-900' : 'border-neutral-200'
                }`}
              >
                <p className="text-sm font-medium text-neutral-900">{pack.credits} reports</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900">
                  ₹{rupees(pack.pricePaise).toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-xs text-neutral-500">₹{pack.perReportRupees} per report</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Your requests</h2>

        {requests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
            No requests yet. Ask for a product above.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-neutral-900">{r.requested_query}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      STATUS_STYLES[r.status] ?? 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                  <span>Asked {formatWhen(r.created_at)}</span>
                  {r.status === 'queued' && <span>Ready by {formatWhen(r.promised_by)}</span>}
                  {r.served_from_cache && <span>Served from existing research — credit returned</span>}
                </div>

                {/* Relevance warnings are surfaced, not buried: supplier directories do
                    return loosely-related sellers and the customer should know. */}
                {r.quality_report?.warnings?.length ? (
                  <p className="text-xs text-amber-700">{r.quality_report.warnings.join(' · ')}</p>
                ) : null}

                {r.status === 'refunded' && r.last_error && (
                  <p className="text-xs text-neutral-600">{r.last_error}</p>
                )}

                {r.status === 'delivered' && r.product_idea_id && (
                  <Link
                    href={`/dashboard/research/${r.product_idea_id}`}
                    className="text-sm font-medium text-neutral-900 underline underline-offset-4"
                  >
                    Open report
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
