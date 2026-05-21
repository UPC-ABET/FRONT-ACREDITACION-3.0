import { RubricEditorPage } from '@/modules/evaluation/pages'

interface Params {
  params: {
    rubricId: string
  }
}

export default async function Page({ params }: Params) {
  // Next.js may provide `params` as a Promise in some setups — await to unwrap
  const resolved = await params
  return <RubricEditorPage rubricId={resolved.rubricId} />
}
