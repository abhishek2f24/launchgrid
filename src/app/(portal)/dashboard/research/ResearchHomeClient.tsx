'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Compass, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { createResearchProject } from '@/actions/research'

interface Project {
  id: string
  name: string
  created_at: string
}

export function ResearchHomeClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    setError(null)
    startTransition(async () => {
      const result = await createResearchProject(name)
      if (!result.data) {
        setError(result.error ?? 'Something went wrong')
        return
      }
      setName('')
      setProjects((prev) => [{ id: result.data.id, name: name.trim(), created_at: new Date().toISOString() }, ...prev])
    })
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent-primary)] uppercase tracking-widest mb-2">
          <Compass className="w-3.5 h-3.5" /> Research
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-mark-ink)] tracking-tight">Decide what to sell, before you build</h1>
        <p className="text-sm text-[var(--color-mark-secondary)] mt-2 max-w-xl">
          Enter a product idea, compare suppliers, and see landed cost, margin, and a launch verdict — then turn a winning
          idea into a live store listing in one click.
        </p>
      </div>

      <div className="bg-white border border-black/5 rounded-[1.5rem] p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Name this research, e.g. Delicates Laundry Kit"
            className="flex-1 h-11 px-4 rounded-xl border border-black/10 bg-[var(--color-mark-base)] text-sm font-medium text-[var(--color-mark-ink)] placeholder:text-[var(--color-mark-secondary)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
          />
          <button
            onClick={handleCreate}
            disabled={isPending || name.trim().length < 2}
            className="h-11 px-5 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Start research
          </button>
        </div>
        {error && <p className="text-xs text-[var(--color-mark-red)] font-medium mt-2">{error}</p>}
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 bg-white border border-black/5 rounded-[1.5rem]">
          <Sparkles className="w-8 h-8 text-[var(--accent-primary)] mb-3" />
          <p className="text-sm font-semibold text-[var(--color-mark-ink)]">No research yet</p>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-1">Start above with your first product idea.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/research/${project.id}`}
              className="group flex items-center justify-between p-5 bg-white border border-black/5 rounded-2xl hover:border-[var(--accent-primary)]/30 hover:shadow-sm transition-all"
            >
              <div>
                <p className="text-sm font-bold text-[var(--color-mark-ink)]">{project.name}</p>
                <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">
                  Started {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--color-mark-secondary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
