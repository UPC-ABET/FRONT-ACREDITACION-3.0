import dynamic from 'next/dynamic';

const ProjectEvaluatePage = dynamic(() =>
	import('@/modules/evaluation/pages').then((m) => m.ProjectEvaluatePage),
);

interface Params {
	params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: Params) {
	const { projectId } = await params;
	return <ProjectEvaluatePage projectId={projectId} gradeTypeId={55} />;
}
