'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiData } from '@/shared/lib';
import { triggerBrowserDownload } from '@/shared/utils';
import { useI18n } from '@/providers';
import { courseOutcomeMappingFiltersService } from '../services/courseOutcomeMappingFiltersService';
import {
	courseOutcomeMappingMaintenanceService,
	courseOutcomeMappingsService,
	type CourseOutcomeMappingFilters,
} from '../services/courseOutcomeMappingsService';
import type {
	AccreditorOption,
	CommissionOption,
	CourseOutcomeMappingBulkSave,
	CourseOutcomeMappingFilter,
	CourseOutcomeMappingFilterRow,
	CourseOutcomeMappingView,
	ProgramOption,
} from '../types';
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

export function useAccreditors() {
	return useQuery({
		queryKey: academicQueryKeys.accreditors(),
		queryFn: () =>
			courseOutcomeMappingFiltersService
				.accreditors()
				.then((response) => getApiData<AccreditorOption[]>(response)),
		staleTime: Infinity,
	});
}

export function useCommissionOptions(accreditorId: number | null) {
	return useQuery({
		queryKey: academicQueryKeys.commissionOptions(accreditorId ?? 0),
		queryFn: () =>
			courseOutcomeMappingFiltersService
				.commissionOptions(accreditorId!)
				.then((response) => getApiData<CommissionOption[]>(response)),
		enabled: accreditorId != null,
	});
}

export function useProgramOptions(commissionId: number | null) {
	return useQuery({
		queryKey: academicQueryKeys.programOptions(commissionId ?? 0),
		queryFn: () =>
			courseOutcomeMappingFiltersService
				.programOptions(commissionId!)
				.then((response) => getApiData<ProgramOption[]>(response)),
		enabled: commissionId != null,
	});
}

export function useProgramCommissionsDetailed(filter: CourseOutcomeMappingFilter, enabled = true) {
	return useQuery({
		queryKey: academicQueryKeys.programCommissionsDetailed(filter),
		queryFn: () =>
			courseOutcomeMappingFiltersService
				.detailedByFilters(filter)
				.then((response) => getApiData<CourseOutcomeMappingFilterRow[]>(response)),
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
				.then((response) => getApiData<CourseOutcomeMappingView>(response)),
		enabled: programCommissionId != null,
	});
}

export function useCourseOutcomeMappingBulkSave() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (body: CourseOutcomeMappingBulkSave) =>
			courseOutcomeMappingMaintenanceService
				.bulkSave(body)
				.then((response) => getApiData<CourseOutcomeMappingView>(response)),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({
				queryKey: academicQueryKeys.courseOutcomeMappingMaintenanceView(
					variables.programCommissionId,
				),
			});
		},
	});
}

export function useCourseOutcomeMappingExport() {
	const { locale } = useI18n();

	return useMutation({
		mutationFn: (programCommissionId: number) =>
			courseOutcomeMappingMaintenanceService.exportPdf(programCommissionId, locale as 'es' | 'en'),
		onSuccess: ({ blob, filename }) => triggerBrowserDownload(blob, filename),
	});
}
