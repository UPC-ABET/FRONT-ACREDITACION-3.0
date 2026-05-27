'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	deleteFinding,
	getFindingDetail,
	listFindings,
	patchFinding,
} from '../services/ifcFindingsService';
import type { PatchFindingBody } from '../types';
import { ifcQueryKeys } from './useIfcs';

export const findingQueryKeys = {
	all: ['ifc-findings'] as const,
	list: (chartIds: number[], periodId: number) =>
		['ifc-findings', 'list', { chartIds, periodId }] as const,
	detail: (id: number) => ['ifc-findings', 'detail', id] as const,
};

export function useFindings(chartIds: number[], periodId: number, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: findingQueryKeys.list(chartIds, periodId),
		queryFn: () => listFindings(chartIds, periodId),
		enabled: (options?.enabled ?? true) && chartIds.length > 0 && periodId > 0,
	});
}

export function useFindingDetail(id: number | undefined) {
	return useQuery({
		queryKey: findingQueryKeys.detail(id!),
		queryFn: () => getFindingDetail(id!),
		enabled: id != null && Number.isFinite(id),
	});
}

export function usePatchFinding() {
	const queryClient = useQueryClient();
	return useMutation<{ id: number }, Error, { id: number; payload: PatchFindingBody }>({
		mutationFn: ({ id, payload }) => patchFinding(id, payload),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: findingQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: findingQueryKeys.detail(variables.id) });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
		},
	});
}

export function useDeleteFinding() {
	const queryClient = useQueryClient();
	return useMutation<void, Error, number>({
		mutationFn: (id) => deleteFinding(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: findingQueryKeys.all });
			queryClient.invalidateQueries({ queryKey: ifcQueryKeys.all });
		},
	});
}
