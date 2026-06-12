'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enrolledStudentsService } from '../services';
import type { EnrolledStudentMaintenanceUpdate } from '../types';

interface MaintenanceListParams {
	academicPeriodId: number | null;
	programId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export const enrolledStudentsMaintenanceKeys = {
	all: ['enrolled-students-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...enrolledStudentsMaintenanceKeys.all, 'list', params] as const,
};

export function useEnrolledStudentsMaintenance(params: MaintenanceListParams) {
	return useQuery({
		// academicPeriodId is part of the key so a period switch re-fetches; it is
		// sent to the API as a header, not a query param.
		queryKey: enrolledStudentsMaintenanceKeys.list(params),
		queryFn: () =>
			enrolledStudentsService
				.maintenanceList({
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

export function useEnrolledStudentMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: enrolledStudentsMaintenanceKeys.all });

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: EnrolledStudentMaintenanceUpdate }) =>
			enrolledStudentsService.maintenanceUpdate(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			enrolledStudentsService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { update, remove };
}
