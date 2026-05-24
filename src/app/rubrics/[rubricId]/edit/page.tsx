import dynamic from 'next/dynamic';

const RubricEditorPage = dynamic(() =>
	import('@/modules/evaluation/pages').then((m) => m.RubricEditorPage),
);

interface Params {
  params: {
    rubricId: string
  }
}

export default async function Page({ params }: Params) {
  const resolved = await params
  return <RubricEditorPage rubricId={resolved.rubricId} />
}
