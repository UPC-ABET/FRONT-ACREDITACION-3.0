'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	performanceLevelsService,
	type FilterPerformanceLevelDto,
	type CreatePerformanceLevelDto,
	type UpdatePerformanceLevelDto,
} from '@/modules/academic/services/performanceLevelsService';

export const performanceLevelsQueryKeys = {
	all: ['performance-levels'] as const,
	filtered: (filters: FilterPerformanceLevelDto) =>
		['performance-levels', 'filtered', filters] as const,
};

export function usePerformanceLevels(
	filters: FilterPerformanceLevelDto,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: performanceLevelsQueryKeys.filtered(filters),
		queryFn: () => performanceLevelsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}

export function useCreatePerformanceLevel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreatePerformanceLevelDto) =>
			performanceLevelsService.create(dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['performance-levels'] });
		},
	});
}

export function useUpdatePerformanceLevel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...dto }: { id: number } & UpdatePerformanceLevelDto) =>
			performanceLevelsService.update(id, dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['performance-levels'] });
		},
	});
}

export function useDeletePerformanceLevel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => performanceLevelsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['performance-levels'] });
		},
	});
}
