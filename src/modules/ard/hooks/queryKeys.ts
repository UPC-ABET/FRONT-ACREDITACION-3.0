import type { ArdMaintenanceParams } from '../types';

export const ardQueryKeys = {
	all: ['ard'] as const,
	maintenance: (params: ArdMaintenanceParams, academicPeriodId: number | null) =>
		[...ardQueryKeys.all, 'maintenance', params, academicPeriodId] as const,
	detail: (id: number | null) => [...ardQueryKeys.all, 'detail', id] as const,
	classRepresentatives: (
		programId: number | null,
		campusId: number | null,
		academicPeriodId: number | null,
	) =>
		[...ardQueryKeys.all, 'class-representatives', programId, campusId, academicPeriodId] as const,
	programCourses: (programId: number | null, academicPeriodId: number | null) =>
		[...ardQueryKeys.all, 'program-courses', programId, academicPeriodId] as const,
	courseProfessors: (
		courseId: number | null,
		campusId: number | null,
		academicPeriodId: number | null,
	) => [...ardQueryKeys.all, 'course-professors', courseId, campusId, academicPeriodId] as const,
};
