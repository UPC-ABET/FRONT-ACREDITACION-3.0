import { useQuery } from '@tanstack/react-query';
import { coursesService } from '../services';
import { FilterCourseRequest } from '../types';

export const coursesQueryKeys = {
	all: ['courses'] as const,
	filtered: (filters: FilterCourseRequest) => ['courses', 'filtered', filters] as const,
};

export function useCourses(filters: FilterCourseRequest = {}) {
	return useQuery({
		queryKey: coursesQueryKeys.filtered(filters),
		queryFn: () => coursesService.getByFilters(filters).then((r) => r.data),
	});
}
