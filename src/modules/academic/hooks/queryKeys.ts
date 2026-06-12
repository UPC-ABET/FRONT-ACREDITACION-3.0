import type { StudyPlanCourseFilters } from '../services/studyPlanCoursesService';
import type { CourseOutcomeMappingFilters } from '../services/courseOutcomeMappingsService';
import type { FilterPerformanceLevelDto } from '../services/performanceLevelsService';
import type { CourseOutcomeMappingFilter } from '../types';

export const academicQueryKeys = {
	all: ['academic'] as const,

	studyPlanCourses: () => [...academicQueryKeys.all, 'spc'] as const,
	studyPlanCoursesByFilter: (filters: StudyPlanCourseFilters) =>
		[...academicQueryKeys.studyPlanCourses(), filters] as const,

	courseOutcomeMappings: () => [...academicQueryKeys.all, 'com'] as const,
	courseOutcomeMappingsByFilter: (filters: CourseOutcomeMappingFilters) =>
		[...academicQueryKeys.courseOutcomeMappings(), filters] as const,

	courseOutcomeMappingMaintenance: () => [...academicQueryKeys.all, 'com-maintenance'] as const,
	courseOutcomeMappingMaintenanceFilters: (filter: CourseOutcomeMappingFilter) =>
		[...academicQueryKeys.courseOutcomeMappingMaintenance(), 'filters', filter] as const,
	courseOutcomeMappingMaintenanceView: (programCommissionId: number) =>
		[...academicQueryKeys.courseOutcomeMappingMaintenance(), 'view', programCommissionId] as const,

	performanceLevels: () => [...academicQueryKeys.all, 'performance-levels'] as const,
	performanceLevelsByFilter: (filters: FilterPerformanceLevelDto) =>
		[...academicQueryKeys.performanceLevels(), filters] as const,
};
