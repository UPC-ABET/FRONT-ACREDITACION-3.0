import { ApiResponse } from '@/shared';
import { FilterCourseRequest, CourseResponse, EnrolledStudentResponse } from '../types';
import { apiPost } from '@/shared/lib';

export const coursesService = {
	getByFilters(filters: FilterCourseRequest = {}): Promise<ApiResponse<CourseResponse[]>> {
		return apiPost('/courses/get-by-filters', filters);
	},

	getEnrolledStudents(
		courseId: number,
		filters: {
			isActive?: boolean;
			academicPeriodId?: number;
			campusId?: number;
			studyPlanAcademicPeriodId?: number;
			search?: string;
		} = {},
	): Promise<ApiResponse<EnrolledStudentResponse[]>> {
		return apiPost(`/courses/${courseId}/enrolled-students`, { isActive: true, ...filters });
	},

	getEnrolledStudentsByFilters(filters: {
		studyPlanAcademicPeriodId?: number;
		isActive?: boolean;
		search?: string;
	}): Promise<ApiResponse<EnrolledStudentResponse[]>> {
		return apiPost('/enrolled-students/get-by-filters', filters);
	},
};
