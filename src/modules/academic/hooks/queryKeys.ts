import type {
	StudyPlanCourseFilters,
	CourseOutcomeMappingFilters,
	FilterPerformanceLevelDto,
	CourseOutcomeMappingFilter,
} from '../types';

export const academicQueryKeys = {
	all: ['academic'] as const,

	studyPlanCourses: () => [...academicQueryKeys.all, 'spc'] as const,
	studyPlanCoursesByFilter: (filters: StudyPlanCourseFilters) =>
		[...academicQueryKeys.studyPlanCourses(), filters] as const,
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
