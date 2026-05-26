'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	studyPlanCoursesService,
	type StudyPlanCourseFilters,
} from '../services/studyPlanCoursesService';
import { academicQueryKeys } from './query-keys';

export function useStudyPlanCourses(
	filters: StudyPlanCourseFilters,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: academicQueryKeys.studyPlanCoursesByFilter(filters),
		queryFn: () => studyPlanCoursesService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}

export function useUpdateStudyPlanCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: number; body: { extra: Record<string, unknown> } }) =>
			studyPlanCoursesService.update(id, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.studyPlanCourses() });
		},
	});
}
