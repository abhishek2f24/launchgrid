'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { recordObservation } from '@/actions/investigation'

function Save() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-50 disabled:opacity-40"
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

/**
 * One observable field. Absent is rendered as "Unknown" — never blank, never zero —
 * because a blank input and a genuine zero are different findings.
 */
export default function EvidenceField({
  investigationId,
  predicate,
  label,
  unit,
  current,
  confidence,
  method,
}: {
  investigationId: string
  predicate: string
  label: string
  unit?: string
  current: unknown
  confidence: number
  method?: string
}) {
  const [state, action] = useActionState(recordObservation, null)
  const isKnown = current !== null && current !== undefined

  return (
    <div className="flex flex-col gap-1.5 border-b border-neutral-100 py-3 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-neutral-800">{label}</span>
        {isKnown ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="font-semibold tabular-nums text-neutral-900">
              {Array.isArray(current) ? current.join(', ') : String(current)}
              {unit === 'INR' ? '' : unit && unit !== 'fraction' ? ` ${unit}` : ''}
            </span>
            <span className="text-neutral-400">
              {method === 'user' ? 'you' : method} · conf {confidence.toFixed(2)}
            </span>
          </span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            Unknown
          </span>
        )}
      </div>

      <form action={action} className="flex gap-2">
        <input type="hidden" name="investigationId" value={investigationId} />
        <input type="hidden" name="predicate" value={predicate} />
        <input
          name="value"
          placeholder={isKnown ? 'Update…' : unit === 'fraction' ? 'e.g. 0.15' : 'Record what you found'}
          aria-label={label}
          className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-900"
        />
        <Save />
      </form>

      {state?.error && <p role="alert" className="text-xs text-red-600">{state.error}</p>}
    </div>
  )
}
