'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceLevelsService } from '@/modules/academic/services';
import type {
	FilterPerformanceLevelDto,
	CreatePerformanceLevelDto,
	UpdatePerformanceLevelDto,
} from '@/modules/academic/types';
import { academicQueryKeys } from '@/modules/academic/hooks';

export function usePerformanceLevels(
	filters: FilterPerformanceLevelDto,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: academicQueryKeys.performanceLevelsByFilter(filters),
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
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.performanceLevels() });
		},
	});
}

export function useUpdatePerformanceLevel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...dto }: { id: number } & UpdatePerformanceLevelDto) =>
			performanceLevelsService.update(id, dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.performanceLevels() });
		},
	});
}

export function useDeletePerformanceLevel() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => performanceLevelsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.performanceLevels() });
		},
	});
}
