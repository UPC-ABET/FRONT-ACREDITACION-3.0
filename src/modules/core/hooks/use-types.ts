'use client';

import { useQuery } from '@tanstack/react-query';
import { typesService } from '../services/typesService';
import { coreQueryKeys } from './query-keys';

export function useTypes(
	filters: { type_group_id?: number },
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: coreQueryKeys.typesByFilter(filters),
		queryFn: () => typesService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled ?? true,
		staleTime: Infinity,
	});
}

export function useTypesByGroupCode(groupCode: string, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: coreQueryKeys.typesByGroupCode(groupCode),
		queryFn: () => typesService.getByGroupCode(groupCode).then((r) => r.data),
		enabled: (options?.enabled ?? true) && Boolean(groupCode),
		staleTime: Infinity,
	});
}
