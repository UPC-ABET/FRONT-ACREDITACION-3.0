'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyPlansService } from '../services';
import type { StudyPlanMaintenanceCreate, StudyPlanMaintenanceUpdate } from '../types';

interface MaintenanceListParams {
	modalityTypeId: number | null;
	programId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export const studyPlansMaintenanceKeys = {
	all: ['study-plans-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...studyPlansMaintenanceKeys.all, 'list', params] as const,
};

export function useStudyPlansMaintenance(params: MaintenanceListParams) {
	return useQuery({
		// modalityTypeId/programId are part of the key so either switch re-fetches; the
		// modality is sent to the API as a header, the program as a query param.
		queryKey: studyPlansMaintenanceKeys.list(params),
		queryFn: () =>
			studyPlansService
				.maintenanceList({
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
					programId: params.programId ?? undefined,
				})
				.then((response) => response.data),
		enabled: params.modalityTypeId != null,
		placeholderData: (previousData) => previousData,
	});
}

export function useStudyPlanMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyPlansMaintenanceKeys.all });

	const create = useMutation({
		mutationFn: (body: StudyPlanMaintenanceCreate) =>
			studyPlansService.maintenanceCreate(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: StudyPlanMaintenanceUpdate }) =>
			studyPlansService.maintenanceUpdate(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			studyPlansService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}
