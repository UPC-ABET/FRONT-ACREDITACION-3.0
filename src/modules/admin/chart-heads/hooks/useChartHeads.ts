'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { configureChartHeads, getAllSchools, getAllUsers, getChartHeadsConfig } from '../services';
import type {
	ChartHeadsConfig,
	ConfigureChartHeadsPayload,
	SchoolOption,
	UserOption,
} from '../types';
import { chartHeadsKeys } from './queryKeys';

export function useChartHeadsConfig(academicPeriodId: number | null) {
	return useQuery<ChartHeadsConfig, Error>({
		queryKey: chartHeadsKeys.config(academicPeriodId ?? 0),
		queryFn: () => getChartHeadsConfig(academicPeriodId as number),
		enabled: academicPeriodId !== null,
		staleTime: 0,
	});
}

export function useSchoolOptions() {
	return useQuery<SchoolOption[], Error>({
		queryKey: chartHeadsKeys.schools(),
		queryFn: getAllSchools,
		staleTime: Infinity,
	});
}

export function useUserOptions() {
	return useQuery<UserOption[], Error>({
		queryKey: chartHeadsKeys.users(),
		queryFn: getAllUsers,
		staleTime: Infinity,
	});
}

export function useConfigureChartHeads() {
	const queryClient = useQueryClient();
	return useMutation<ChartHeadsConfig, Error, ConfigureChartHeadsPayload>({
		mutationFn: configureChartHeads,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: chartHeadsKeys.config(variables.academicPeriodId),
			});
		},
	});
}
