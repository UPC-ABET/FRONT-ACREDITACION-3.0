'use client';

import { useQuery } from '@tanstack/react-query';
import {
	courseOutcomeMappingsService,
	type CourseOutcomeMappingFilters,
} from '../services/courseOutcomeMappingsService';
import { academicQueryKeys } from './queryKeys';

export function useCourseOutcomeMappings(
	filters: CourseOutcomeMappingFilters,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: academicQueryKeys.courseOutcomeMappingsByFilter(filters),
		queryFn: () => courseOutcomeMappingsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
	});
}
