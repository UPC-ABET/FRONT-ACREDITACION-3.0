'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classRepresentativesService } from '../services';
import type { AssignRepresentativeDto } from '../types';

interface MaintenanceListParams {
	academicPeriodId: number | null;
	modalityTypeId: number | null;
	programId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export const classRepresentativesMaintenanceKeys = {
	all: ['class-representatives-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...classRepresentativesMaintenanceKeys.all, 'list', params] as const,
};

export function useClassRepresentativesMaintenance(params: MaintenanceListParams) {
	return useQuery({
		// modalityTypeId is part of the key so a modality switch re-fetches, even though
		// it only travels as the X-Modality-Type-Id header, not a query param.
		queryKey: classRepresentativesMaintenanceKeys.list(params),
		queryFn: () =>
			classRepresentativesService
				.maintenance({
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
					programId: params.programId ?? undefined,
				})
				.then((response) => response.data),
		enabled: params.academicPeriodId != null,
		placeholderData: (previousData) => previousData,
	});
}

export function useClassRepresentativeMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: classRepresentativesMaintenanceKeys.all });

	const assign = useMutation({
		mutationFn: (body: AssignRepresentativeDto) =>
			classRepresentativesService.assign(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (body: AssignRepresentativeDto) =>
			classRepresentativesService.remove(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { assign, remove };
}
