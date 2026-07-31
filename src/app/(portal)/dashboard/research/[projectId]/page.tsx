import { notFound } from 'next/navigation'
import { getResearchProject, listProductIdeas } from '@/actions/research'
import { ProjectDetailClient } from './ProjectDetailClient'

export default async function ResearchProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params

  // Another tenant's project id previously rendered a working, empty project page — and any
  // idea added there silently landed in the visitor's own tenant. 404 instead.
  const project = await getResearchProject(projectId)
  if (!project) notFound()

  const ideas = await listProductIdeas(projectId)
  return <ProjectDetailClient projectId={projectId} initialIdeas={ideas} />
}
