'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RESET_PASSWORD_ENTITY_TYPE_CODES } from '../constants';
import { chartsService } from '../services/chartsService';
import type { ChartCreatePayload, ChartResetPasswordPayload, ChartUpdatePayload } from '../types';
import { chartsQueryKeys } from './queryKeys';

export function useChartTree(academicPeriodId: number | null, schoolId: number | null) {
	return useQuery({
		queryKey: chartsQueryKeys.tree(academicPeriodId, schoolId),
		queryFn: () => chartsService.tree(),
		enabled: academicPeriodId != null && schoolId != null,
	});
}

export function usePrograms(enabled: boolean) {
	return useQuery({
		queryKey: chartsQueryKeys.programs(),
		queryFn: () => chartsService.programsGetAll(),
		enabled,
	});
}

export function useChartMutations() {
	const queryClient = useQueryClient();

	const invalidateTree = () =>
		queryClient.invalidateQueries({ queryKey: chartsQueryKeys.treeAll() });

	const create = useMutation({
		mutationFn: (payload: ChartCreatePayload) => chartsService.create(payload),
		onSuccess: invalidateTree,
	});

	const update = useMutation({
		mutationFn: ({ chartId, payload }: { chartId: number; payload: ChartUpdatePayload }) =>
			chartsService.update(chartId, payload),
		onSuccess: invalidateTree,
	});

	const remove = useMutation({
		mutationFn: (chartId: number) => chartsService.remove(chartId),
		onSuccess: invalidateTree,
	});

	return { create, update, remove };
}

export function useResetChartPasswords() {
	return useMutation({
		mutationFn: (payload: ChartResetPasswordPayload) => {
			const entityTypeCodes = payload.entityTypeCodes.filter((code) =>
				RESET_PASSWORD_ENTITY_TYPE_CODES.includes(code),
			);
			return chartsService.resetPasswords({ entityTypeCodes });
		},
	});
}
