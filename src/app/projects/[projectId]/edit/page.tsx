import { ProjectEditPage } from '@/modules/evaluation/pages'

interface Params {
  params: Promise<{ projectId: string }>
}

export default async function Page({ params }: Params) {
  const { projectId } = await params
  return <ProjectEditPage projectId={projectId} />
}
