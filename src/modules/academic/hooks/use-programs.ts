import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services';
import { FilterProgramRequest } from '../api/dtos/request';

export const programsQueryKeys = {
	all: ['programs'] as const,
	filtered: (filters: FilterProgramRequest) => ['programs', 'filtered', filters] as const,
};

export function usePrograms(filters: FilterProgramRequest = {}) {
	return useQuery({
		queryKey: programsQueryKeys.filtered(filters),
		queryFn: () => programsService.getByFilters(filters).then((r) => r.data),
	});
}
