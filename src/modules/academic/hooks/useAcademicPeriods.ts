import { useQuery } from '@tanstack/react-query';
import { academicPeriodsService } from '../services';
import { FilterAcademicPeriodRequest } from '../types';

export const academicPeriodsQueryKeys = {
	all: ['academic-periods'] as const,
	filtered: (filters: FilterAcademicPeriodRequest) =>
		['academic-periods', 'filtered', filters] as const,
};

export function useAcademicPeriods(
	filters: FilterAcademicPeriodRequest = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: academicPeriodsQueryKeys.filtered(filters),
		queryFn: () => academicPeriodsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}
