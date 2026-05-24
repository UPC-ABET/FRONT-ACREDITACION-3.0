import { ApiResponse } from '@/shared';
import { FilterCourseRequest } from '../api/dtos/request';
import { CourseResponse, EnrolledStudentResponse } from '../api/dtos/response';
import { apiPost } from '@/shared/lib';

export const coursesService = {
	getByFilters(filters: FilterCourseRequest = {}): Promise<ApiResponse<CourseResponse[]>> {
		return apiPost('/courses/get-by-filters', filters);
	},

	getEnrolledStudents(
		courseId: number,
		filters: {
			is_active?: boolean;
			academic_period_id?: number;
			campus_id?: number;
			study_plan_academic_period_id?: number;
		} = {},
	): Promise<ApiResponse<EnrolledStudentResponse[]>> {
		return apiPost(`/courses/${courseId}/enrolled-students`, { is_active: true, ...filters });
	},
};
