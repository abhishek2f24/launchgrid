import Link from 'next/link'
import { listInvestigations } from '@/actions/investigation'
import NewInvestigationForm from './NewInvestigationForm'

export const dynamic = 'force-dynamic'

const VERDICT_STYLE: Record<string, string> = {
  BUY: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  WAIT: 'bg-amber-50 text-amber-900 border-amber-200',
  REJECT: 'bg-red-50 text-red-800 border-red-200',
}

export default async function InvestigatePage() {
  const investigations = await listInvestigations()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Product investigations
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-600">
          One product, one decision. Gather evidence until you can honestly say
          BUY, WAIT or REJECT — and see exactly how much of the answer is still unknown.
        </p>
      </header>

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <NewInvestigationForm />
      </section>

      {investigations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          No investigations yet. Name a product above to start one.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {investigations.map((inv) => (
            <li key={inv.id}>
              <Link
                href={`/dashboard/investigate/${inv.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-400"
              >
                <div>
                  <span className="font-medium text-neutral-900">{inv.product_name}</span>
                  <span className="ml-2 text-xs text-neutral-500 tabular-nums">
                    budget ₹{Number(inv.budget_inr).toLocaleString('en-IN')}
                  </span>
                </div>
                {inv.decision && (
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${VERDICT_STYLE[inv.decision]}`}>
                    {inv.decision}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
