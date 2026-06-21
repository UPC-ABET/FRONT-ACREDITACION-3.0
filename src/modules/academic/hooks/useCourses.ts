import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../services';
import { FilterCourseRequest } from '../types';

interface EnrolledStudentFilters {
	isActive?: boolean;
	studyPlanAcademicPeriodId?: number;
	search?: string;
}

export const coursesQueryKeys = {
	all: ['courses'] as const,
	filtered: (filters: FilterCourseRequest) => ['courses', 'filtered', filters] as const,
	enrolledStudents: (courseId: number, filters: EnrolledStudentFilters) =>
		['courses', courseId, 'enrolled-students', filters] as const,
};

export function useCourses(filters: FilterCourseRequest = {}) {
	return useQuery({
		queryKey: coursesQueryKeys.filtered(filters),
		queryFn: () => coursesService.getByFilters(filters).then((r) => r.data),
	});
}

export function useEnrolledStudents(
	courseId: number | null,
	filters: EnrolledStudentFilters = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: coursesQueryKeys.enrolledStudents(courseId as number, filters),
		queryFn: () =>
			coursesService.getEnrolledStudents(courseId as number, filters).then((r) => r.data ?? []),
		enabled: (options?.enabled ?? true) && courseId != null,
	});
}
