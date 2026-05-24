import { useQuery } from '@tanstack/react-query';
import { rubricsService } from '../services';

export const rubricsQueryKeys = {
	all: ['rubrics'] as const,
	detail: (rubricId: string | number) => ['rubrics', rubricId] as const,
};

export function useRubrics() {
	return useQuery({
		queryKey: rubricsQueryKeys.all,
		queryFn: async () => {
			const response = await rubricsService.getAll();
			return response.data;
		},
	});
}

export function useRubric(rubricId: string | number) {
	return useQuery({
		queryKey: rubricsQueryKeys.detail(rubricId),
		queryFn: async () => {
			const response = await rubricsService.getById(rubricId);
			return response.data;
		},
		enabled: Boolean(rubricId),
	});
}
