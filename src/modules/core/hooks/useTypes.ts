'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { typesService } from '../services/typesService';
import { coreQueryKeys } from './queryKeys';

export function useTypes(filters: { typeGroupId?: number }, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: coreQueryKeys.typesByFilter(filters),
		queryFn: () => typesService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
		staleTime: Infinity,
	});
}

export function useTypesByGroupCode(groupCode: string, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: coreQueryKeys.typesByGroupCode(groupCode),
		queryFn: () => typesService.getByGroupCode(groupCode).then((r) => r.data),
		enabled: (options?.enabled ?? true) && Boolean(groupCode),
		staleTime: Infinity,
	});
}

export function useSetCanEvaluate(groupCode: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			body,
		}: {
			id: number;
			body: { canEvaluate: boolean; maxEvaluators?: number };
		}) => typesService.setCanEvaluate(id, body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: coreQueryKeys.typesByGroupCode(groupCode) }),
	});
}

export function useCreateType(groupCode: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: Parameters<typeof typesService.create>[0]) => typesService.create(body),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: coreQueryKeys.typesByGroupCode(groupCode) }),
	});
}

export function useDeleteType(groupCode: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => typesService.delete(id),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: coreQueryKeys.typesByGroupCode(groupCode) }),
	});
}
