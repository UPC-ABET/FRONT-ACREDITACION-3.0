'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getTypesByGroupCode, type TypeOption } from '@/modules/core';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { campusesService, courseSectionsService } from '../services';
import type { CourseSectionMaintenanceCreate, CourseSectionMaintenanceUpdate } from '../types';

interface MaintenanceListParams {
	academicPeriodId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export const courseSectionsMaintenanceKeys = {
	all: ['course-sections-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...courseSectionsMaintenanceKeys.all, 'list', params] as const,
};

export function useCourseSectionsMaintenance(params: MaintenanceListParams) {
	return useQuery({
		queryKey: courseSectionsMaintenanceKeys.list(params),
		queryFn: () =>
			courseSectionsService
				.maintenanceList({
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
				})
				.then((response) => response.data),
		enabled: params.academicPeriodId != null,
		placeholderData: (previousData) => previousData,
	});
}

export function useCourseSectionMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: courseSectionsMaintenanceKeys.all });

	const create = useMutation({
		mutationFn: (body: CourseSectionMaintenanceCreate) =>
			courseSectionsService.maintenanceCreate(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: CourseSectionMaintenanceUpdate }) =>
			courseSectionsService.maintenanceUpdate(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			courseSectionsService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}

export function useCampuses() {
	return useQuery({
		queryKey: ['campuses', 'all'],
		queryFn: () => campusesService.getAll().then((response) => response.data ?? []),
		staleTime: Infinity,
	});
}

export function useSectionModalityTypes() {
	return useQuery({
		queryKey: ['types', TYPE_GROUP_CODES.SECTION_MODALITY],
		queryFn: () => getTypesByGroupCode(TYPE_GROUP_CODES.SECTION_MODALITY) as Promise<TypeOption[]>,
		staleTime: Infinity,
	});
}
