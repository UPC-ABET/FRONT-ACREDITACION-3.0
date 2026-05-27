import type { StudyPlanCourseFilters } from '../services/studyPlanCoursesService';
import type { CourseOutcomeMappingFilters } from '../services/courseOutcomeMappingsService';
import type { FilterPerformanceLevelDto } from '../services/performanceLevelsService';

export const academicQueryKeys = {
	all: ['academic'] as const,

	studyPlanCourses: () => [...academicQueryKeys.all, 'spc'] as const,
	studyPlanCoursesByFilter: (filters: StudyPlanCourseFilters) =>
		[...academicQueryKeys.studyPlanCourses(), filters] as const,

	courseOutcomeMappings: () => [...academicQueryKeys.all, 'com'] as const,
	courseOutcomeMappingsByFilter: (filters: CourseOutcomeMappingFilters) =>
		[...academicQueryKeys.courseOutcomeMappings(), filters] as const,

	performanceLevels: () => [...academicQueryKeys.all, 'performance-levels'] as const,
	performanceLevelsByFilter: (filters: FilterPerformanceLevelDto) =>
		[...academicQueryKeys.performanceLevels(), filters] as const,
};
