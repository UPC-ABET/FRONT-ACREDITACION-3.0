import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { closePeriod, createPeriod, listPeriods } from '../services';
import { LOADS_QUERY_KEYS } from '../constants';
import type { CreatePeriodPayload, Period } from '../types';

export function usePeriods() {
	return useQuery<Period[], Error>({
		queryKey: LOADS_QUERY_KEYS.periods,
		queryFn: listPeriods,
	});
}

export function useCreatePeriod() {
	const queryClient = useQueryClient();
	return useMutation<Period, Error, CreatePeriodPayload>({
		mutationFn: createPeriod,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: LOADS_QUERY_KEYS.periods }),
	});
}

export function useClosePeriod() {
	const queryClient = useQueryClient();
	return useMutation<{ success: boolean }, Error, number>({
		mutationFn: closePeriod,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: LOADS_QUERY_KEYS.periods }),
	});
}
