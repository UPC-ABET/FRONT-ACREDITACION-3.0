import type {
	StudyPlanCourseFilters,
	CourseOutcomeMappingFilters,
	FilterPerformanceLevelDto,
	CourseOutcomeMappingFilter,
} from '../types';

/**
 * School / period / modality travel as request headers, so responses depend on them without
 * them appearing in any filter. Query keys for scoped endpoints carry this alongside the
 * filters. See `useAbetScope`.
 */
export interface AbetScope {
	schoolId: number | null;
	academicPeriodId: number | null;
	modalityTypeId: number | null;
}

export const academicQueryKeys = {
	all: ['academic'] as const,

	studyPlanCourses: () => [...academicQueryKeys.all, 'spc'] as const,
	studyPlanCoursesByFilter: (filters: StudyPlanCourseFilters, scope: AbetScope) =>
		[...academicQueryKeys.studyPlanCourses(), filters, scope] as const,
	studyPlanCoursesView: (studyPlanId: number | null, academicPeriodId: number | null) =>
		[...academicQueryKeys.studyPlanCourses(), 'view', studyPlanId, academicPeriodId] as const,

	courseOutcomeMappings: () => [...academicQueryKeys.all, 'com'] as const,
	courseOutcomeMappingsByFilter: (filters: CourseOutcomeMappingFilters) =>
		[...academicQueryKeys.courseOutcomeMappings(), filters] as const,

	courseOutcomeMappingMaintenance: () => [...academicQueryKeys.all, 'com-maintenance'] as const,
	courseOutcomeMappingMaintenanceView: (programCommissionId: number) =>
		[...academicQueryKeys.courseOutcomeMappingMaintenance(), 'view', programCommissionId] as const,

	accreditors: () => [...academicQueryKeys.all, 'accreditors'] as const,
	commissionOptions: (accreditorId: number) =>
		[...academicQueryKeys.all, 'program-commissions', 'commission-options', accreditorId] as const,
	programOptions: (commissionId: number) =>
		[...academicQueryKeys.all, 'program-commissions', 'program-options', commissionId] as const,
	programCommissionsDetailed: (filter: CourseOutcomeMappingFilter) =>
		[...academicQueryKeys.all, 'program-commissions', 'detailed', filter] as const,

	performanceLevels: () => [...academicQueryKeys.all, 'performance-levels'] as const,
	performanceLevelsByFilter: (filters: FilterPerformanceLevelDto) =>
		[...academicQueryKeys.performanceLevels(), filters] as const,

	classRepresentatives: () => [...academicQueryKeys.all, 'class-representatives'] as const,
};
