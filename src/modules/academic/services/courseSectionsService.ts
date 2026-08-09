import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import type {
	CourseSectionMaintenanceCreate,
	CourseSectionMaintenanceItem,
	CourseSectionMaintenanceList,
	CourseSectionMaintenanceUpdate,
} from '../types';

export const courseSectionsService = {
	// Period travels as the X-Academic-Period-Id header (injected globally), not a query param.
	maintenanceList(params: {
		page?: number;
		pageSize?: number;
		search?: string;
		programId?: number;
	}): Promise<ApiResponse<CourseSectionMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		if (params.programId != null) query.set('programId', String(params.programId));
		const qs = query.toString();
		return apiGet(`/course-sections/maintenance${qs ? `?${qs}` : ''}`);
	},

	// Period travels as the X-Academic-Period-Id header (injected globally), not in the body.
	maintenanceCreate(
		body: CourseSectionMaintenanceCreate,
	): Promise<ApiResponse<CourseSectionMaintenanceItem>> {
		return apiPost('/course-sections/maintenance', body);
	},

	maintenanceUpdate(
		id: number,
		body: CourseSectionMaintenanceUpdate,
	): Promise<ApiResponse<CourseSectionMaintenanceItem>> {
		return apiPut(`/course-sections/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/course-sections/maintenance/${id}`);
	},
};
