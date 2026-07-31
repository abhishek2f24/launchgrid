import { listResearchProjects } from '@/actions/research'
import { ResearchHomeClient } from './ResearchHomeClient'

export default async function ResearchHomePage() {
  const projects = await listResearchProjects()
  return <ResearchHomeClient initialProjects={projects} />
}
