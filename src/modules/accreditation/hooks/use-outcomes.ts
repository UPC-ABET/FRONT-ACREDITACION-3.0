'use client';

import { useQueries } from '@tanstack/react-query';
import { outcomesService } from '../services/outcomesService';
import { accreditationQueryKeys } from './query-keys';
import type { OutcomeResponse } from '../types';

export function useOutcomes(ids: number[]) {
	const results = useQueries({
		queries: ids.map((id) => ({
			queryKey: accreditationQueryKeys.outcomeById(id),
			queryFn: () => outcomesService.getById(id).then((r) => r.data),
			enabled: id != null && id > 0,
		})),
	});

	const data = results.map((r) => r.data).filter((d): d is OutcomeResponse => d != null);
	const isLoading = results.some((r) => r.isLoading);
	const isError = results.some((r) => r.isError);

	return { data, isLoading, isError };
}
