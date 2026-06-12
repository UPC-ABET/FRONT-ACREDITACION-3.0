import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPut } from '@/shared/lib';
import type {
	StudentSectionEnrollmentMaintenanceItem,
	StudentSectionEnrollmentMaintenanceList,
	StudentSectionEnrollmentMaintenanceUpdate,
} from '../types';

export const studentSectionEnrollmentsService = {
	// Period travels as the X-Academic-Period-Id header (injected globally), not a query param.
	maintenanceList(params: {
		page?: number;
		pageSize?: number;
		search?: string;
		programId?: number;
	}): Promise<ApiResponse<StudentSectionEnrollmentMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		if (params.programId != null) query.set('programId', String(params.programId));
		const qs = query.toString();
		return apiGet(`/student-section-enrollments/maintenance${qs ? `?${qs}` : ''}`);
	},

	maintenanceUpdate(
		id: number,
		body: StudentSectionEnrollmentMaintenanceUpdate,
	): Promise<ApiResponse<StudentSectionEnrollmentMaintenanceItem>> {
		return apiPut(`/student-section-enrollments/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/student-section-enrollments/maintenance/${id}`);
	},
};
