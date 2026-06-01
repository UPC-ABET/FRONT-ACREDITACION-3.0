export const configurationKeys = {
	all: ['admin', 'configuration'] as const,
	periods: () => [...configurationKeys.all, 'periods'] as const,
	periodsList: () => [...configurationKeys.periods(), 'list'] as const,
	programCommissions: () => [...configurationKeys.all, 'program-commissions'] as const,
	programCommissionsByPeriod: (academicPeriodId: number) =>
		[...configurationKeys.programCommissions(), 'list', academicPeriodId] as const,
};
