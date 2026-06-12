import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPut } from '@/shared/lib';
import type {
	CourseSectionMaintenanceItem,
	CourseSectionMaintenanceList,
	CourseSectionMaintenanceUpdate,
} from '../types';

export const courseSectionsService = {
	maintenanceList(params: {
		academicPeriodId: number;
		page?: number;
		pageSize?: number;
		search?: string;
	}): Promise<ApiResponse<CourseSectionMaintenanceList>> {
		const query = new URLSearchParams();
		query.set('academicPeriodId', String(params.academicPeriodId));
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		return apiGet(`/course-sections/maintenance?${query.toString()}`);
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
