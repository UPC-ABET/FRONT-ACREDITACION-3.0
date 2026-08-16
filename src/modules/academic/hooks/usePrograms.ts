import { useQuery } from '@tanstack/react-query';
import { programsService } from '../services';
import { FilterProgramRequest } from '../types';
import type { AbetScope } from './queryKeys';
import { useAbetScope } from './useAbetScope';

export const programsQueryKeys = {
	all: ['programs'] as const,
	filtered: (filters: FilterProgramRequest, scope: AbetScope) =>
		['programs', 'filtered', filters, scope] as const,
	allActive: () => ['programs', 'all-active', { isActive: true }] as const,
	bySchoolModality: (schoolId: number | null, modalityTypeId: number | null) =>
		[
			'programs',
			'filtered',
			{ schoolId, modalityTypeId, isActive: true, schoolFilter: true },
		] as const,
};

export function usePrograms(filters: FilterProgramRequest = {}, options?: { enabled?: boolean }) {
	const scope = useAbetScope();
	return useQuery({
		queryKey: programsQueryKeys.filtered(filters, scope),
		queryFn: () => programsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}

/**
 * Programs of the active modality for program selectors (GET /programs/by-modality).
 * The modality travels as the X-Modality-Type-Id header; it is part of the key so a
 * modality switch re-fetches, and the query is disabled until a modality is selected.
 */
export function useProgramsByModality(modalityTypeId: number | null) {
	return useQuery({
		queryKey: [...programsQueryKeys.all, 'by-modality', modalityTypeId] as const,
		queryFn: () => programsService.byModality().then((r) => r.data ?? []),
		enabled: modalityTypeId != null,
	});
}
