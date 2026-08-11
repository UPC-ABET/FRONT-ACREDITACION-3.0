'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { coreQueryKeys, getTypesByGroupCode } from '@/modules/core';
import { TYPE_GROUP_CODES } from '@/shared/constants';
import { coursesService, studyPlanCoursesService, studyPlansService } from '../services';
import type { CourseUpdateBody, StudyPlanCourseCreate, StudyPlanCourseLevelOption } from '../types';
import { academicQueryKeys } from './queryKeys';

function toLevelNumber(value: unknown): number {
	if (typeof value === 'number') return value;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

export function useStudyPlanCourseLevels() {
	return useQuery({
		queryKey: [
			...coreQueryKeys.typesByGroupCode(TYPE_GROUP_CODES.STUDY_PLAN_COURSE_LEVEL),
			'levels',
		] as const,
		queryFn: (): Promise<StudyPlanCourseLevelOption[]> =>
			getTypesByGroupCode(TYPE_GROUP_CODES.STUDY_PLAN_COURSE_LEVEL).then((types) =>
				types
					.map((type) => ({
						id: type.id,
						name: type.name,
						level: toLevelNumber(type.extra?.level),
					}))
					.sort((first, second) => first.level - second.level),
			),
		staleTime: Infinity,
	});
}

export function useStudyPlanCoursesView(
	studyPlanId: number | null,
	academicPeriodId: number | null,
) {
	return useQuery({
		// Period travels as the X-Academic-Period-Id header; it is part of the key so a
		// period switch re-fetches. Disabled until both the plan and a period exist.
		queryKey: academicQueryKeys.studyPlanCoursesView(studyPlanId, academicPeriodId),
		queryFn: () => studyPlansService.getCoursesView(studyPlanId!).then((response) => response.data),
		enabled: studyPlanId != null && academicPeriodId != null,
		placeholderData: (previousData) => previousData,
	});
}

export function useStudyPlanCoursesViewMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: academicQueryKeys.studyPlanCourses() });

	const updateCourse = useMutation({
		mutationFn: ({ courseId, body }: { courseId: number; body: CourseUpdateBody }) =>
			coursesService.update(courseId, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	// The grade type lives in the study plan course's `extra`, not in the shared course record:
	// the same course can be evaluated by a different grade in another plan or period.
	const updateGradeType = useMutation({
		mutationFn: ({ id, gradeTypeId }: { id: number; gradeTypeId: number | null }) =>
			studyPlanCoursesService
				.update(id, { extra: { gradeTypeId } })
				.then((response) => response.data),
		onSuccess: invalidate,
	});

	const createCourse = useMutation({
		mutationFn: (body: StudyPlanCourseCreate) =>
			studyPlanCoursesService.maintenanceCreate(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const removeCourseFromPlan = useMutation({
		mutationFn: (id: number) =>
			studyPlanCoursesService.maintenanceDelete(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { createCourse, updateCourse, updateGradeType, removeCourseFromPlan };
}
