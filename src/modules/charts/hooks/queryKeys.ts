export const chartsQueryKeys = {
	all: ['charts'] as const,
	tree: (academicPeriodId: number | null, schoolId: number | null) =>
		[...chartsQueryKeys.all, 'tree', academicPeriodId, schoolId] as const,
	programs: () => [...chartsQueryKeys.all, 'programs'] as const,
};
