export const chartsQueryKeys = {
	all: ['charts'] as const,
	treeAll: () => [...chartsQueryKeys.all, 'tree'] as const,
	tree: (academicPeriodId: number | null, schoolId: number | null) =>
		[...chartsQueryKeys.treeAll(), academicPeriodId, schoolId] as const,
	programs: () => [...chartsQueryKeys.all, 'programs'] as const,
};
