import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { professorsService } from '../services';
import type { ProfessorMaintenanceUpdate } from '../types';

interface MaintenanceListParams {
	page: number;
	pageSize: number;
	search: string;
}

export const professorsMaintenanceKeys = {
	all: ['professors-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...professorsMaintenanceKeys.all, 'list', params] as const,
};

export function useProfessorsMaintenance(params: MaintenanceListParams) {
	return useQuery({
		queryKey: professorsMaintenanceKeys.list(params),
		queryFn: () =>
			professorsService
				.maintenanceList({
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
				})
				.then((response) => response.data),
		// Keep the previous page visible while the next page loads (smooth pagination).
		placeholderData: (previousData) => previousData,
	});
}

export function useProfessorMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: professorsMaintenanceKeys.all });

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: ProfessorMaintenanceUpdate }) =>
			professorsService.maintenanceUpdate(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			professorsService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { update, remove };
}
