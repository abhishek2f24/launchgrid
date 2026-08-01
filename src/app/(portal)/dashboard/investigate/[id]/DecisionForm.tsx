'use client'

import { useActionState } from 'react'
import { recordDecision } from '@/actions/investigation'

export default function DecisionForm({
  investigationId,
  current,
}: {
  investigationId: string
  current: string | null
}) {
  const [state, action] = useActionState(recordDecision, null)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="investigationId" value={investigationId} />
      <textarea
        name="note"
        rows={2}
        placeholder="Why? (this is what you'll reread in three months)"
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
      <div className="flex flex-wrap gap-2">
        {(['BUY', 'WAIT', 'REJECT'] as const).map((d) => (
          <button
            key={d}
            type="submit"
            name="decision"
            value={d}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              current === d
                ? 'bg-neutral-900 text-white'
                : 'border border-neutral-300 text-neutral-900 hover:bg-neutral-50'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      {current && (
        <p className="text-xs text-neutral-500">
          Your decision: <strong>{current}</strong>. Recorded separately from the engine&rsquo;s
          verdict so the two can be compared later.
        </p>
      )}
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
