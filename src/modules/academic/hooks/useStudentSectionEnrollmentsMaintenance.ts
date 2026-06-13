'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentSectionEnrollmentsService } from '../services';
import type {
	StudentSectionEnrollmentMaintenanceCreate,
	StudentSectionEnrollmentMaintenanceUpdate,
} from '../types';

interface MaintenanceListParams {
	academicPeriodId: number | null;
	programId: number | null;
	page: number;
	pageSize: number;
	search: string;
}

export const studentSectionEnrollmentsMaintenanceKeys = {
	all: ['student-section-enrollments-maintenance'] as const,
	list: (params: MaintenanceListParams) =>
		[...studentSectionEnrollmentsMaintenanceKeys.all, 'list', params] as const,
};

export function useStudentSectionEnrollmentsMaintenance(params: MaintenanceListParams) {
	return useQuery({
		// academicPeriodId/programId are part of the key so a switch re-fetches; the
		// period is sent to the API as a header, the program as a query param.
		queryKey: studentSectionEnrollmentsMaintenanceKeys.list(params),
		queryFn: () =>
			studentSectionEnrollmentsService
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

export function useStudentSectionEnrollmentMaintenanceMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studentSectionEnrollmentsMaintenanceKeys.all });

	const create = useMutation({
		mutationFn: (body: StudentSectionEnrollmentMaintenanceCreate) =>
			studentSectionEnrollmentsService.maintenanceCreate(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: StudentSectionEnrollmentMaintenanceUpdate }) =>
			studentSectionEnrollmentsService
				.maintenanceUpdate(id, body)
				.then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			studentSectionEnrollmentsService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}
