'use client';

import { useQuery } from '@tanstack/react-query';
import { commissionsService } from '../services';
import type { FilterCommissionRequest } from '../types';

export const commissionsQueryKeys = {
	all: ['commissions'] as const,
	filtered: (filters: FilterCommissionRequest) => ['commissions', 'filtered', filters] as const,
};

export function useCommissions(filters: FilterCommissionRequest = {}) {
	return useQuery({
		queryKey: commissionsQueryKeys.filtered(filters),
		queryFn: () => commissionsService.getByFilters(filters).then((r) => r.data),
	});
}
