import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPut } from '@/shared/lib';
import type {
	EnrolledStudentMaintenanceItem,
	EnrolledStudentMaintenanceList,
	EnrolledStudentMaintenanceUpdate,
} from '../types';

export const enrolledStudentsService = {
	// The selected academic period travels as the X-Academic-Period-Id header,
	// injected globally by the API client — never as a query param here.
	maintenanceList(params: {
		page?: number;
		pageSize?: number;
		search?: string;
	}): Promise<ApiResponse<EnrolledStudentMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		const qs = query.toString();
		return apiGet(`/enrolled-students/maintenance${qs ? `?${qs}` : ''}`);
	},

	maintenanceUpdate(
		id: number,
		body: EnrolledStudentMaintenanceUpdate,
	): Promise<ApiResponse<EnrolledStudentMaintenanceItem>> {
		return apiPut(`/enrolled-students/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/enrolled-students/maintenance/${id}`);
	},
};
