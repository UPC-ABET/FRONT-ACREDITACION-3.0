import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getParameterByFilters, updateParameter } from '../services/parametersAdminService';
import type { ParameterRow, UpdateParameterBody } from '../services/types';

export const parametersQueryKeys = {
	all: ['parameters'] as const,
	byCode: (code: string) => ['parameters', 'byCode', code] as const,
};

export function useParameterByCode<T>(code: string, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: parametersQueryKeys.byCode(code),
		queryFn: () => getParameterByFilters<T>(code),
		enabled: options?.enabled ?? true,
	});
}

export function useUpdateParameter<T>() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: UpdateParameterBody<T> }) =>
			updateParameter<T>(id, payload),
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: parametersQueryKeys.all });
		},
	});
}
