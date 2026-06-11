'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	associateProgramCommission,
	listProgramCommissions,
	unassociateProgramCommission,
} from '../services';
import type { AssociateProgramCommissionPayload, ProgramCommissionAssociation } from '../types';
import { configurationKeys } from './queryKeys';

export function useProgramCommissions(academicPeriodId: number | null) {
	return useQuery<ProgramCommissionAssociation[], Error>({
		queryKey: configurationKeys.programCommissionsByPeriod(academicPeriodId ?? 0),
		queryFn: () => listProgramCommissions(academicPeriodId as number),
		enabled: academicPeriodId !== null,
	});
}

export function useAssociateProgramCommission() {
	const queryClient = useQueryClient();
	return useMutation<ProgramCommissionAssociation, Error, AssociateProgramCommissionPayload>({
		mutationFn: associateProgramCommission,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: configurationKeys.programCommissionsByPeriod(variables.academicPeriodId),
			});
		},
	});
}

export function useUnassociateProgramCommission(academicPeriodId: number) {
	const queryClient = useQueryClient();
	return useMutation<{ success: boolean }, Error, number>({
		mutationFn: unassociateProgramCommission,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: configurationKeys.programCommissionsByPeriod(academicPeriodId),
			});
		},
	});
}
