export const LOADS_QUERY_KEYS = {
	periods: ['loads', 'periods'] as const,
	studyPlansByPeriod: (periodId: number) => ['loads', 'periods', periodId, 'study-plans'] as const,
	programCommissionsByPeriod: (periodId: number) =>
		['loads', 'periods', periodId, 'program-commissions'] as const,
	uploadHistory: ['loads', 'upload-history'] as const,
	uploadHistoryList: (filters: Record<string, unknown>) =>
		['loads', 'upload-history', 'list', filters] as const,
	uploadHistoryDetail: (id: number) => ['loads', 'upload-history', 'detail', id] as const,
};
