import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import { CourseOutcomeMappingResponse } from '../types';

export type CourseOutcomeMappingFilters = {
	study_plan_course_id?: number;
	is_active?: boolean;
};

export const courseOutcomeMappingsService = {
	getByFilters(
		filters: CourseOutcomeMappingFilters,
	): Promise<ApiResponse<CourseOutcomeMappingResponse[]>> {
		return apiPost('/course-outcome-mappings/get-by-filters', filters);
	},
};
