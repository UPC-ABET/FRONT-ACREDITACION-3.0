import { ApiResponse } from '@/shared';
import { apiPost, apiPut } from '@/shared/lib';
import type {
	CourseOutcomeMappingBulkSave,
	CourseOutcomeMappingFilter,
	CourseOutcomeMappingFilterRow,
	CourseOutcomeMappingResponse,
	CourseOutcomeMappingView,
} from '../types';

export type CourseOutcomeMappingFilters = {
	studyPlanCourseId?: number;
	isActive?: boolean;
};

export const courseOutcomeMappingsService = {
	getByFilters(
		filters: CourseOutcomeMappingFilters,
	): Promise<ApiResponse<CourseOutcomeMappingResponse[]>> {
		return apiPost('/course-outcome-mappings/get-by-filters', filters);
	},
};

const MAINTENANCE_BASE = '/course-outcome-mappings/maintenance';

export const courseOutcomeMappingMaintenanceService = {
	getByFilters(
		filter: CourseOutcomeMappingFilter,
	): Promise<ApiResponse<CourseOutcomeMappingFilterRow[]>> {
		return apiPost(`${MAINTENANCE_BASE}/get-by-filters`, filter);
	},

	view(programCommissionId: number): Promise<ApiResponse<CourseOutcomeMappingView>> {
		return apiPost(`${MAINTENANCE_BASE}/view`, { programCommissionId });
	},

	bulkSave(body: CourseOutcomeMappingBulkSave): Promise<ApiResponse<CourseOutcomeMappingView>> {
		return apiPut(`${MAINTENANCE_BASE}/bulk-save`, body);
	},
};
