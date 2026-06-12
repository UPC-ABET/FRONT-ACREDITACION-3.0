'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	courseOutcomeMappingMaintenanceService,
	courseOutcomeMappingsService,
	type CourseOutcomeMappingFilters,
} from '../services/courseOutcomeMappingsService';
import type { CourseOutcomeMappingBulkSave, CourseOutcomeMappingFilter } from '../types';
import { academicQueryKeys } from './queryKeys';

export function useCourseOutcomeMappings(
	filters: CourseOutcomeMappingFilters,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: academicQueryKeys.courseOutcomeMappingsByFilter(filters),
		queryFn: () => courseOutcomeMappingsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}

export function useCourseOutcomeMappingFilters(filter: CourseOutcomeMappingFilter, enabled = true) {
	return useQuery({
		queryKey: academicQueryKeys.courseOutcomeMappingMaintenanceFilters(filter),
		queryFn: () =>
			courseOutcomeMappingMaintenanceService.getByFilters(filter).then((response) => response.data),
		enabled,
		placeholderData: (previousData) => previousData,
	});
}

export function useCourseOutcomeMappingView(programCommissionId: number | null) {
	return useQuery({
		queryKey: academicQueryKeys.courseOutcomeMappingMaintenanceView(programCommissionId ?? 0),
		queryFn: () =>
			courseOutcomeMappingMaintenanceService
				.view(programCommissionId!)
				.then((response) => response.data),
		enabled: programCommissionId != null,
	});
}

export function useCourseOutcomeMappingBulkSave() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: CourseOutcomeMappingBulkSave) =>
			courseOutcomeMappingMaintenanceService.bulkSave(body).then((response) => response.data),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: academicQueryKeys.courseOutcomeMappingMaintenanceView(
					variables.programCommissionId,
				),
			});
		},
	});
}
