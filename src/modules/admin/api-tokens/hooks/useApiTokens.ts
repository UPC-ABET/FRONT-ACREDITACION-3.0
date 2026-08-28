'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createApiToken, getApiTokens, revokeApiToken, updateApiToken } from '../services';
import type { ApiToken, CreateApiTokenBody, IssuedApiToken, UpdateApiTokenBody } from '../types';

export const apiTokensKeys = {
	all: ['admin', 'api-tokens'] as const,
	list: () => [...apiTokensKeys.all, 'list'] as const,
};

export function useApiTokens() {
	return useQuery<ApiToken[], Error>({
		queryKey: apiTokensKeys.list(),
		queryFn: getApiTokens,
	});
}

export function useCreateApiToken() {
	const queryClient = useQueryClient();

	return useMutation<IssuedApiToken, Error, CreateApiTokenBody>({
		mutationFn: createApiToken,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: apiTokensKeys.all });
		},
	});
}

export function useUpdateApiToken() {
	const queryClient = useQueryClient();

	return useMutation<ApiToken, Error, { id: number; body: UpdateApiTokenBody }>({
		mutationFn: ({ id, body }) => updateApiToken(id, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: apiTokensKeys.all });
		},
	});
}

export function useRevokeApiToken() {
	const queryClient = useQueryClient();

	return useMutation<ApiToken, Error, number>({
		mutationFn: revokeApiToken,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: apiTokensKeys.all });
		},
	});
}
