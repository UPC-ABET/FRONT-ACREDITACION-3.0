import type { ArdReportFilters } from '../types';

export const ardQueryKeys = {
	all: ['ard'] as const,
	list: (params: { page: number; pageSize: number; search: string; academicPeriodId: number | null }) =>
		[...ardQueryKeys.all, 'list', params] as const,
	detail: (id: number | null) => [...ardQueryKeys.all, 'detail', id] as const,
	delegates: (
		campusId: number | null,
		programId: number | null,
		academicPeriodId: number | null,
	) => [...ardQueryKeys.all, 'delegates', campusId, programId, academicPeriodId] as const,
	guests: (
		campusId: number | null,
		programId: number | null,
		search: string,
		academicPeriodId: number | null,
	) => [...ardQueryKeys.all, 'guests', campusId, programId, search, academicPeriodId] as const,
	sections: (campusId: number | null, studentCode: string | undefined, academicPeriodId: number | null) =>
		[...ardQueryKeys.all, 'sections', campusId, studentCode ?? 'all', academicPeriodId] as const,
	orgChartCourses: (
		programId: number | null,
		campusId: number | null,
		academicPeriodId: number | null,
	) => [...ardQueryKeys.all, 'org-chart-courses', programId, campusId, academicPeriodId] as const,
	courseProfessors: (
		courseId: number | null,
		programId: number | null,
		campusId: number | null,
		academicPeriodId: number | null,
	) =>
		[
			...ardQueryKeys.all,
			'course-professors',
			courseId,
			programId,
			campusId,
			academicPeriodId,
		] as const,
	studentDefault: (campusId: number | null, studentCode: string | null) =>
		[...ardQueryKeys.all, 'student-default', campusId, studentCode] as const,
	report: (filters: ArdReportFilters) => [...ardQueryKeys.all, 'report', filters] as const,
};
