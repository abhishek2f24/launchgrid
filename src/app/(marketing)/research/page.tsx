import type { Metadata } from 'next'
import { ResearchExplorer } from './ResearchExplorer'
import { JourneyNav } from '@/components/signup-journey/JourneyNav'
import { Footer } from '@/components/signup-journey/Footer'
import { GrainOverlay } from '@/components/ui-landing/GrainOverlay'

export const metadata: Metadata = {
  title: 'Research a Product Idea Before You Build | LaunchGrid',
  description: 'Compare supplier evidence, estimate landed cost, and understand margin before you commit capital or build your online store.',
  alternates: { canonical: 'https://launchgrid.in/research' },
  openGraph: {
    title: 'Research a Product Idea Before You Build | LaunchGrid',
    description: 'See the supplier, cost, and margin questions to answer before you launch.',
    url: 'https://launchgrid.in/research',
    type: 'website',
  },
}

export default async function ResearchLandingPage({ searchParams }: { searchParams: Promise<{ idea?: string; category?: string }> }) {
  const { idea, category } = await searchParams
  return (
    <div className="theme-marketing min-h-screen bg-[var(--color-mark-base)] text-[var(--color-mark-primary)] flex flex-col antialiased relative selection:bg-[var(--color-mark-ink)] selection:text-[var(--color-mark-inverse)]">
      <GrainOverlay />
      <JourneyNav />

      <main className="flex-1 relative z-10 pt-28 pb-20">
        <ResearchExplorer initialIdea={idea ?? ''} initialCategory={category ?? ''} />
      </main>

      <Footer />
    </div>
  )
}
