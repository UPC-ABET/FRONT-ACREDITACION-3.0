import { GRADE_IDS } from '@/modules/evaluation/constants/type-codes';
import dynamic from 'next/dynamic';

const ProjectEvaluatePage = dynamic(() =>
	import('@/modules/evaluation/pages').then((m) => m.ProjectEvaluatePage),
);

interface Params {
	params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: Params) {
	const { projectId } = await params;
	return <ProjectEvaluatePage projectId={projectId} gradeTypeId={GRADE_IDS.PARTIAL} />;
}
