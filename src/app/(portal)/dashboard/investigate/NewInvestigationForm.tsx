'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import { createInvestigation } from '@/actions/investigation'

function Submit() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:opacity-40"
    >
      {pending ? 'Starting…' : 'Start investigation'}
    </button>
  )
}

export default function NewInvestigationForm() {
  const [state, action] = useActionState(createInvestigation, null)
  const router = useRouter()

  useEffect(() => {
    if (state?.id) router.push(`/dashboard/investigate/${state.id}`)
  }, [state?.id, router])

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="productName"
          required
          minLength={3}
          placeholder="e.g. Magnetic cable organizer"
          aria-label="Product to investigate"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
        />
        <input
          name="budget"
          type="number"
          defaultValue={20000}
          min={1}
          aria-label="Budget in rupees"
          className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm tabular-nums outline-none focus:border-neutral-900 sm:w-40"
        />
        <Submit />
      </div>
      <p className="text-xs text-neutral-500">
        The budget is used as a hard gate — a first order that doesn&rsquo;t fit it can never be a BUY.
      </p>
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
