export const chartHeadsKeys = {
	all: ['admin', 'chart-heads'] as const,
	config: (academicPeriodId: number) =>
		[...chartHeadsKeys.all, 'config', academicPeriodId] as const,
	schools: () => [...chartHeadsKeys.all, 'schools'] as const,
	users: () => [...chartHeadsKeys.all, 'users'] as const,
};
