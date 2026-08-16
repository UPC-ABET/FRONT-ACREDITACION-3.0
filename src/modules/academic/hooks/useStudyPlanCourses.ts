'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studyPlanCoursesService } from '../services/studyPlanCoursesService';
import type { StudyPlanCourseFilters } from '../types';
import { academicQueryKeys } from './queryKeys';
import { useAbetScope } from './useAbetScope';

export function useStudyPlanCourses(
	filters: StudyPlanCourseFilters,
	options?: { enabled?: boolean },
) {
	const scope = useAbetScope();
	return useQuery({
		queryKey: academicQueryKeys.studyPlanCoursesByFilter(filters, scope),
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

export function useEnableEvaluationCourse() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, isEvaluable }: { id: number; isEvaluable: boolean }) =>
			studyPlanCoursesService.enableEvaluation(id, isEvaluable),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: academicQueryKeys.studyPlanCourses() });
		},
	});
}
