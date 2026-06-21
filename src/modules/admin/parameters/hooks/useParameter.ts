'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/shared/lib/apiError';
import { getParameterByFilters } from '../services/parametersAdminService';
import { parametersQueryKeys } from './useParameters';
import type { ParameterRow } from '../types';

export function useParameter<T>(code: string) {
	const queryClient = useQueryClient();

	const query = useQuery({
		queryKey: parametersQueryKeys.byCode(code),
		queryFn: () => getParameterByFilters<T>(code),
	});

	const setData = (row: ParameterRow<T>) =>
		queryClient.setQueryData(parametersQueryKeys.byCode(code), row);

	return {
		data: query.data ?? null,
		loading: query.isLoading,
		error: query.error ? getErrorMessage(query.error, 'admin.params.error.loadFailed') : null,
		refetch: query.refetch,
		setData,
	};
}
