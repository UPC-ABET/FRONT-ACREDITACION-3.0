export const evaluationQueryKeys = {
	all: ['evaluation'] as const,

	evaluations: () => [...evaluationQueryKeys.all, 'evaluations'] as const,

	rubricEditor: (rubricId: string | number) =>
		[...evaluationQueryKeys.all, 'rubric-editor', rubricId] as const,
};
