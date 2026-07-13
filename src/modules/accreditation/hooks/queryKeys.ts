import type { OutcomeConversionFilters } from '../types';

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
	outcomeConversions: () => [...accreditationQueryKeys.all, 'outcome-conversions'] as const,
	// The period travels in the X-Academic-Period-Id header, so it must be part of the key —
	// otherwise a period switch would serve another period's conversions from cache.
	outcomeConversionsList: (academicPeriodId: number | null, filters: OutcomeConversionFilters) =>
		[...accreditationQueryKeys.outcomeConversions(), 'list', academicPeriodId, filters] as const,
	outcomeConversionsCoverage: (academicPeriodId: number | null) =>
		[...accreditationQueryKeys.outcomeConversions(), 'coverage', academicPeriodId] as const,
};
