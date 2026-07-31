'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, ArrowRight, Package } from 'lucide-react'
import { createProductIdea } from '@/actions/research'

interface Idea {
  id: string
  name: string
  category: string | null
  status: string
  target_retail_price: number | null
  created_at: string
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  researching: { label: 'Researching', className: 'bg-black/5 text-[var(--color-mark-secondary)]' },
  launch_ready: { label: 'Launch ready', className: 'bg-green-100 text-[var(--color-mark-green)]' },
  promoted: { label: 'Live in store', className: 'bg-[var(--accent-muted)] text-[var(--accent-primary)]' },
  archived: { label: 'Archived', className: 'bg-black/5 text-[var(--color-mark-secondary)]' },
}

export function ProjectDetailClient({ projectId, initialIdeas }: { projectId: string; initialIdeas: Idea[] }) {
  const [ideas, setIdeas] = useState(initialIdeas)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [maxInvestment, setMaxInvestment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createProductIdea({
        researchProjectId: projectId,
        name,
        category: category || undefined,
        targetRetailPrice: targetPrice ? Number(targetPrice) : undefined,
        maxInitialInvestment: maxInvestment ? Number(maxInvestment) : undefined,
      })
      if (!result.data) {
        setError(result.error ?? 'Something went wrong')
        return
      }
      setIdeas((prev) => [
        { id: result.data.id, name: name.trim(), category: category || null, status: 'researching', target_retail_price: targetPrice ? Number(targetPrice) : null, created_at: new Date().toISOString() },
        ...prev,
      ])
      setName('')
      setCategory('')
      setMaxInvestment('')
      setTargetPrice('')
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <Link href="/dashboard/research" className="text-xs font-semibold text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)]">
          ← All research
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-mark-ink)] tracking-tight mt-2">Product ideas</h1>
      </div>

      <div className="bg-white border border-black/5 rounded-[1.5rem] p-6 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Product name"
            className="h-11 px-4 rounded-xl border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
          />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="h-11 px-4 rounded-xl border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
          />
          <input
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            type="number"
            placeholder="Target retail price (₹)"
            className="h-11 px-4 rounded-xl border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
          />
          <input
            value={maxInvestment}
            onChange={(e) => setMaxInvestment(e.target.value)}
            type="number"
            placeholder="Max first-order budget (₹)"
            className="h-11 px-4 rounded-xl border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
          />
        </div>
        <div className="flex items-center justify-between">
          {error && <p className="text-xs text-[var(--color-mark-red)] font-medium">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={isPending || name.trim().length < 2}
            className="ml-auto h-10 px-5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Add product idea
          </button>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-black/5 rounded-[1.5rem]">
          <Package className="w-8 h-8 text-[var(--accent-primary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--color-mark-ink)]">No product ideas yet</p>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-1">Add one above to start scoring suppliers and margins.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {ideas.map((idea) => {
            const style = STATUS_STYLE[idea.status] ?? STATUS_STYLE.researching
            return (
              <Link
                key={idea.id}
                href={`/dashboard/research/${projectId}/${idea.id}`}
                className="group flex items-center justify-between p-5 bg-white border border-black/5 rounded-2xl hover:border-[var(--accent-primary)]/30 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--color-mark-ink)]">{idea.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.className}`}>{style.label}</span>
                  </div>
                  <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">
                    {idea.category ? `${idea.category} · ` : ''}
                    {idea.target_retail_price ? `Target ₹${idea.target_retail_price}` : 'No target price set'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
