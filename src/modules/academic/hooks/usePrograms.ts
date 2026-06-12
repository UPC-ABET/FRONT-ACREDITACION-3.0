import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services';
import { FilterProgramRequest } from '../types';

export const programsQueryKeys = {
	all: ['programs'] as const,
	filtered: (filters: FilterProgramRequest) => ['programs', 'filtered', filters] as const,
	list: ['programs', 'all'] as const,
};

export function usePrograms(filters: FilterProgramRequest = {}) {
	return useQuery({
		queryKey: programsQueryKeys.filtered(filters),
		queryFn: () => programsService.getByFilters(filters).then((r) => r.data),
	});
}

/** Full program list for select filters (GET /programs/get-all). Loaded once. */
export function useAllPrograms() {
	return useQuery({
		queryKey: programsQueryKeys.list,
		queryFn: () => programsService.getAll().then((r) => r.data ?? []),
		staleTime: Infinity,
	});
}
