import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rubricsService } from '../services';
import type { CreateRubricDto, CreateRubricFullDto, GetAllRubricsParams } from '../types';

export const rubricsQueryKeys = {
	all: ['rubrics'] as const,
	filtered: (params: GetAllRubricsParams) => ['rubrics', 'filtered', params] as const,
	detail: (rubricId: string | number) => ['rubrics', rubricId] as const,
};

export function useRubrics(params: GetAllRubricsParams = {}) {
	return useQuery({
		queryKey: rubricsQueryKeys.filtered(params),
		queryFn: async () => {
			const response = await rubricsService.getAll(params);
			return response.data;
		},
		enabled: !!params.academicPeriodId,
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

export function useCreateRubric() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateRubricDto) => rubricsService.create(dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: rubricsQueryKeys.all });
		},
	});
}

export function useCreateRubricFull() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateRubricFullDto) => rubricsService.createFull(dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: rubricsQueryKeys.all });
		},
	});
}

export function useDeleteRubric() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string | number) => rubricsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: rubricsQueryKeys.all });
		},
	});
}
