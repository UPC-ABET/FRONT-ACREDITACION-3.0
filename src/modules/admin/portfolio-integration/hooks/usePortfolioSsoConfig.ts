'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPortfolioSsoConfig, upsertPortfolioSsoConfig } from '../services/portfolioSsoService';
import type { PortfolioSsoConfigSummary, UpsertPortfolioSsoConfigBody } from '../types';

const portfolioSsoQueryKeys = {
	all: ['admin', 'portfolio-sso-config'] as const,
	config: () => [...portfolioSsoQueryKeys.all, 'config'] as const,
};

export function usePortfolioSsoConfig() {
	return useQuery<PortfolioSsoConfigSummary, Error>({
		queryKey: portfolioSsoQueryKeys.config(),
		queryFn: getPortfolioSsoConfig,
	});
}

export function useUpsertPortfolioSsoConfig() {
	const queryClient = useQueryClient();

	return useMutation<PortfolioSsoConfigSummary, Error, UpsertPortfolioSsoConfigBody>({
		mutationFn: upsertPortfolioSsoConfig,
		onSuccess: (data) => {
			queryClient.setQueryData(portfolioSsoQueryKeys.config(), data);
		},
	});
}
