import { getResearchReport, getCurrentPlanTier } from '@/actions/research'
import { notFound } from 'next/navigation'
import { IdeaDetailClient } from './IdeaDetailClient'

export default async function IdeaDetailPage({ params }: { params: Promise<{ projectId: string; ideaId: string }> }) {
  const { projectId, ideaId } = await params
  const [report, planTier] = await Promise.all([getResearchReport(ideaId), getCurrentPlanTier()])
  if (!report) notFound()
  return <IdeaDetailClient projectId={projectId} ideaId={ideaId} initialReport={report} isPaidPlan={planTier !== 'free'} />
}
