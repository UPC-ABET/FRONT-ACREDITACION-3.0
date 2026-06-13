import { ApiResponse } from '@/shared';
import { apiDelete, apiPost, apiPut, apiPatch } from '@/shared/lib';
import { StudyPlanCourseResponse } from '../types';

export type StudyPlanCourseFilters = {
	academicPeriodId?: number;
	schoolId?: number;
	courseId?: number;
	isActive?: boolean;
	extra?: Record<string, unknown>;
};

export const studyPlanCoursesService = {
	getByFilters(filters: StudyPlanCourseFilters): Promise<ApiResponse<StudyPlanCourseResponse[]>> {
		return apiPost('/study-plan-courses/get-by-filters', filters);
	},

	update(
		id: number,
		body: { extra: Record<string, unknown> },
	): Promise<ApiResponse<StudyPlanCourseResponse>> {
		return apiPut(`/study-plan-courses/update/${id}`, body);
	},

	enableEvaluation(
		id: number,
		isEvaluable: boolean,
	): Promise<ApiResponse<StudyPlanCourseResponse>> {
		return apiPatch(`/study-plan-courses/enable-evaluation/${id}`, { isEvaluable });
	},

	// Removes the course from this study plan (does not delete the shared course).
	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/study-plan-courses/maintenance/${id}`);
	},
};
