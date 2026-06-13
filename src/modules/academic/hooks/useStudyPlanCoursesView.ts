'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesService, studyPlanCoursesService, studyPlansService } from '../services';
import type { CourseUpdateBody } from '../types';

export const studyPlanCoursesViewKeys = {
	all: ['study-plan-courses-view'] as const,
	view: (studyPlanId: number | null, academicPeriodId: number | null) =>
		[...studyPlanCoursesViewKeys.all, studyPlanId, academicPeriodId] as const,
};

export function useStudyPlanCoursesView(
	studyPlanId: number | null,
	academicPeriodId: number | null,
) {
	return useQuery({
		// Period travels as the X-Academic-Period-Id header; it is part of the key so a
		// period switch re-fetches. Disabled until both the plan and a period exist.
		queryKey: studyPlanCoursesViewKeys.view(studyPlanId, academicPeriodId),
		queryFn: () => studyPlansService.getCoursesView(studyPlanId!).then((response) => response.data),
		enabled: studyPlanId != null && academicPeriodId != null,
		placeholderData: (previousData) => previousData,
	});
}

export function useStudyPlanCoursesViewMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: studyPlanCoursesViewKeys.all });

	const updateCourse = useMutation({
		mutationFn: ({ courseId, body }: { courseId: number; body: CourseUpdateBody }) =>
			coursesService.update(courseId, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const removeCourseFromPlan = useMutation({
		mutationFn: (id: number) =>
			studyPlanCoursesService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { updateCourse, removeCourseFromPlan };
}
