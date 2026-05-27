'use client';

import { useQuery } from '@tanstack/react-query';
import { typeGroupsService } from '../services/typeGroupsService';
import { coreQueryKeys } from './queryKeys';

export function useTypeGroups(
	filters: { code?: string } = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: coreQueryKeys.typeGroupsByFilter(filters),
		queryFn: () => typeGroupsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
		staleTime: Infinity,
	});
}
