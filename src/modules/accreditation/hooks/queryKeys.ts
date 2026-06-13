interface OutcomeMaintenanceParams {
	programId: number;
	academicPeriodId: number;
	page: number;
	pageSize: number;
	search: string;
}

export const accreditationQueryKeys = {
	all: ['accreditation'] as const,
	outcomes: () => [...accreditationQueryKeys.all, 'outcomes'] as const,
	outcomeById: (id: number) => [...accreditationQueryKeys.outcomes(), 'by-id', id] as const,
	outcomesMaintenance: () => [...accreditationQueryKeys.outcomes(), 'maintenance'] as const,
	outcomesMaintenanceList: (params: OutcomeMaintenanceParams) =>
		[...accreditationQueryKeys.outcomesMaintenance(), params] as const,
};
