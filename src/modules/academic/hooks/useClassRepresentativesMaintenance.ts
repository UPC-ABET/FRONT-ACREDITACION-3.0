'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classRepresentativesService } from '../services';
import type { AssignRepresentativeDto } from '../types';

interface MaintenanceListParams {
	academicPeriodId: number | null;
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
		queryKey: classRepresentativesMaintenanceKeys.list(params),
		queryFn: () =>
			classRepresentativesService
				.maintenance({
					page: params.page,
					pageSize: params.pageSize,
					search: params.search.trim() || undefined,
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
