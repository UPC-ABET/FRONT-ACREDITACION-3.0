import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	associateProgramCommission,
	listProgramCommissionsByPeriod,
	unassociateProgramCommission,
} from '../services';
import { LOADS_QUERY_KEYS } from '../constants';
import type {
	AssociateProgramCommissionPayload,
	ProgramCommission,
	UnassociateProgramCommissionPayload,
} from '../types';

export function useProgramCommissions(periodId: number | null) {
	return useQuery<ProgramCommission[], Error>({
		queryKey: periodId
			? LOADS_QUERY_KEYS.programCommissionsByPeriod(periodId)
			: ['loads', 'program-commissions', 'noop'],
		queryFn: () => (periodId ? listProgramCommissionsByPeriod(periodId) : Promise.resolve([])),
		enabled: !!periodId,
	});
}

export function useAssociateProgramCommission(periodId: number | null) {
	const queryClient = useQueryClient();
	return useMutation<ProgramCommission, Error, AssociateProgramCommissionPayload>({
		mutationFn: associateProgramCommission,
		onSuccess: () => {
			if (periodId) {
				queryClient.invalidateQueries({
					queryKey: LOADS_QUERY_KEYS.programCommissionsByPeriod(periodId),
				});
			}
		},
	});
}

export function useUnassociateProgramCommission(periodId: number | null) {
	const queryClient = useQueryClient();
	return useMutation<{ success: boolean }, Error, UnassociateProgramCommissionPayload>({
		mutationFn: unassociateProgramCommission,
		onSuccess: () => {
			if (periodId) {
				queryClient.invalidateQueries({
					queryKey: LOADS_QUERY_KEYS.programCommissionsByPeriod(periodId),
				});
			}
		},
	});
}
