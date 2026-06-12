'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { outcomesService } from '../services';
import type { OutcomeMaintenanceUpdate } from '../types';
import { accreditationQueryKeys } from './queryKeys';

interface MaintenanceListParams {
	programId: number | null;
	academicPeriodId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export function useOutcomesMaintenance(params: MaintenanceListParams) {
	const enabled = params.programId != null && params.academicPeriodId != null;

	return useQuery({
		queryKey: accreditationQueryKeys.outcomesMaintenanceList({
			programId: params.programId ?? 0,
			academicPeriodId: params.academicPeriodId ?? 0,
			page: params.page,
			pageSize: params.pageSize,
			search: params.search,
		}),
		queryFn: () =>
			outcomesService
				.maintenanceList({
					programId: params.programId!,
					academicPeriodId: params.academicPeriodId!,
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
				})
				.then((response) => response.data),
		enabled,
		// Keep the previous page visible while the next page loads (smooth pagination).
		placeholderData: (previousData) => previousData,
	});
}

export function useOutcomeMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: accreditationQueryKeys.outcomesMaintenance() });

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: OutcomeMaintenanceUpdate }) =>
			outcomesService.maintenanceUpdate(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			outcomesService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { update, remove };
}
