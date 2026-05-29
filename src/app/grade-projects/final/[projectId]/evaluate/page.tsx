import { TYPE_CODES } from '@/modules/core';
import dynamic from 'next/dynamic';

const ProjectEvaluatePage = dynamic(() =>
	import('@/modules/evaluation/pages').then((m) => m.ProjectEvaluatePage),
);

interface Params {
	params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: Params) {
	const { projectId } = await params;
	return <ProjectEvaluatePage projectId={projectId} gradeTypeCode={TYPE_CODES.GRADE_TYPE.FINAL} />;
}
