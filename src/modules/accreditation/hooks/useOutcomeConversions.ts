'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { outcomeConversionsService } from '../services';
import type {
	OutcomeConversionCreate,
	OutcomeConversionFilters,
	OutcomeConversionUpdate,
} from '../types';
import { accreditationQueryKeys } from './queryKeys';

export function useOutcomeConversions(
	filters: OutcomeConversionFilters,
	academicPeriodId: number | null,
) {
	const enabled =
		academicPeriodId != null &&
		filters.sourceProgramCommissionId != null &&
		filters.targetProgramCommissionId != null;

	return useQuery({
		queryKey: accreditationQueryKeys.outcomeConversionsList(academicPeriodId, filters),
		queryFn: () =>
			outcomeConversionsService.getByFilters(filters).then((response) => response.data ?? []),
		enabled,
	});
}

export function useOutcomeConversionCoverage(academicPeriodId: number | null) {
	return useQuery({
		queryKey: accreditationQueryKeys.outcomeConversionsCoverage(academicPeriodId),
		queryFn: () => outcomeConversionsService.coverage().then((response) => response.data ?? []),
		enabled: academicPeriodId != null,
	});
}

// Conversions and coverage are invalidated together: adding or removing a formula changes which
// target outcomes are still missing one. The semaphore report is deliberately NOT invalidated —
// already-graded evaluations keep their old converted grades until the RV rebuild runs.
export function useOutcomeConversionMutations() {
	const queryClient = useQueryClient();

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: accreditationQueryKeys.outcomeConversions() });

	const create = useMutation({
		mutationFn: (body: OutcomeConversionCreate) =>
			outcomeConversionsService.create(body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const update = useMutation({
		mutationFn: ({ id, body }: { id: number; body: OutcomeConversionUpdate }) =>
			outcomeConversionsService.update(id, body).then((response) => response.data),
		onSuccess: invalidate,
	});

	const remove = useMutation({
		mutationFn: (id: number) =>
			outcomeConversionsService.remove(id).then((response) => response.data),
		onSuccess: invalidate,
	});

	return { create, update, remove };
}
