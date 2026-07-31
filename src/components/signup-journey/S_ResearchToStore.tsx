import Link from 'next/link'
import { ArrowRight, SearchCheck, Store, WalletCards } from 'lucide-react'
import { ChapterLabel } from '../ui-landing/ChapterLabel'
import { EditorialHeadline } from '../ui-landing/EditorialHeadline'

const stages = [
  {
    step: '01',
    title: 'Research the product',
    description: 'Collect supplier facts, market evidence, and the price inputs that matter before inventory is involved.',
    icon: SearchCheck,
  },
  {
    step: '02',
    title: 'Decide with the numbers',
    description: 'See landed cost, MOQ exposure, expected margin, and the evidence still missing from the decision.',
    icon: WalletCards,
  },
  {
    step: '03',
    title: 'Build only when ready',
    description: 'Turn a validated research idea into a draft store product without re-entering core sourcing details.',
    icon: Store,
  },
]

export function SResearchToStore() {
  return (
    <section className="py-24 md:py-32 w-full bg-[var(--color-mark-subtle)]">
      <div className="max-w-6xl mx-auto px-6 md:px-12">
        <div className="max-w-3xl">
          <ChapterLabel chapter="Chapter 02" label="The LaunchGrid path" />
          <EditorialHeadline text={"A store is the result.\nA good decision comes first."} size="lg" />
          <p className="mt-6 font-inter text-base md:text-lg leading-relaxed text-[var(--color-mark-secondary)]">
            LaunchGrid helps you move from a product thought to a sourcing decision before it helps you make a storefront.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-4 md:gap-6">
          {stages.map(({ step, title, description, icon: Icon }) => (
            <article key={step} className="bg-white border border-black/[0.08] rounded-2xl p-6 md:p-7 shadow-[0_1px_3px_rgba(26,26,24,0.05)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-[0.15em] text-[var(--color-mark-amber)]">{step}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-mark-amber)]/10 text-[var(--color-mark-amber)]">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <h3 className="mt-8 font-inter text-lg font-bold text-[var(--color-mark-ink)]">{title}</h3>
              <p className="mt-3 font-inter text-sm leading-relaxed text-[var(--color-mark-secondary)]">{description}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link href="/research" className="inline-flex items-center gap-2 font-inter text-sm font-bold text-[var(--color-mark-ink)] hover:text-[var(--color-mark-amber)] transition-colors">
            Explore product research <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="font-inter text-sm text-[var(--color-mark-secondary)]">No market result is shown until evidence has been collected.</p>
        </div>
      </div>
    </section>
  )
}
