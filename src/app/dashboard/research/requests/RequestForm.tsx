'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { requestResearchReport } from '@/actions/researchCredits'

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {pending ? 'Queueing…' : 'Request report'}
    </button>
  )
}

export default function RequestForm({ balance }: { balance: number }) {
  const [state, formAction] = useActionState(requestResearchReport, null)
  const noCredits = balance < 1

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="query"
          required
          minLength={3}
          maxLength={120}
          placeholder="e.g. Bamboo cutlery travel set"
          aria-label="Product to research"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        />
        <SubmitButton disabled={noCredits} />
      </div>

      {noCredits && (
        <p className="text-sm text-amber-700">
          You have no credits left. Buy a pack to request a report.
        </p>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <p role="status" className="text-sm text-emerald-700">
          Queued. We&rsquo;ll have it ready within 6 hours — you keep the credit only if
          the report is usable.
        </p>
      )}
    </form>
  )
}
