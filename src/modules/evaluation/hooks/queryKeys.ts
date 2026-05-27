export const evaluationQueryKeys = {
	all: ['evaluation'] as const,

	evaluations: () => [...evaluationQueryKeys.all, 'evaluations'] as const,
	evaluationsByEvaluator: (evaluatorId: string | number) =>
		[...evaluationQueryKeys.evaluations(), 'by-evaluator', evaluatorId] as const,

	rubricEditor: (rubricId: string | number) =>
		[...evaluationQueryKeys.all, 'rubric-editor', rubricId] as const,
};
