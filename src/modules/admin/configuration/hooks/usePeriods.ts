'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { activatePeriod, createPeriod, listPeriods } from '../services';
import type { ConfigurationPeriod, CreatePeriodPayload } from '../types';
import { configurationKeys } from './queryKeys';

export function useConfigurationPeriods() {
	return useQuery<ConfigurationPeriod[], Error>({
		queryKey: configurationKeys.periodsList(),
		queryFn: listPeriods,
	});
}

export function useCreatePeriod() {
	const queryClient = useQueryClient();
	return useMutation<ConfigurationPeriod, Error, CreatePeriodPayload>({
		mutationFn: createPeriod,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: configurationKeys.periods() });
		},
	});
}

export function useActivatePeriod() {
	const queryClient = useQueryClient();
	return useMutation<ConfigurationPeriod, Error, number>({
		mutationFn: activatePeriod,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: configurationKeys.periods() });
		},
	});
}
