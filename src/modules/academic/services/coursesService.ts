import { ApiResponse } from '@/shared';
import type {
	FilterCourseRequest,
	CourseResponse,
	CourseLookupItem,
	CourseUpdateBody,
	EnrolledStudentResponse,
	PaginatedEnvelope,
} from '../types';
import { apiGet, apiPost, apiPut } from '@/shared/lib';

export const coursesService = {
	getByFilters(filters: FilterCourseRequest = {}): Promise<ApiResponse<CourseResponse[]>> {
		return apiPost('/courses/get-by-filters', filters);
	},

	// Edits the shared course record (affects everywhere the course is used).
	update(courseId: number, body: CourseUpdateBody): Promise<ApiResponse<CourseResponse>> {
		return apiPut(`/courses/update/${courseId}`, body);
	},

	lookup(params: {
		search?: string;
		page?: number;
		pageSize?: number;
	}): Promise<ApiResponse<PaginatedEnvelope<CourseLookupItem>>> {
		const query = new URLSearchParams();
		if (params.search) query.set('search', params.search);
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		const qs = query.toString();
		return apiGet(`/courses/lookup${qs ? `?${qs}` : ''}`);
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
