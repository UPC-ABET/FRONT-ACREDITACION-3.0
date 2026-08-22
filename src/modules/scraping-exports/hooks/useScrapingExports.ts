'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AbetScope, useAbetScope } from '@/modules/academic';
import { getScrapingExportStatus, regenerateScrapingExport } from '../services';
import type { ScrapingExportStatusResponse, ScrapingExportType } from '../types';

const SCRAPING_EXPORT_POLL_INTERVAL_MS = 5_000;

export const scrapingExportsQueryKeys = {
	all: ['scraping-exports'] as const,
	status: (exportType: ScrapingExportType, scope: AbetScope) =>
		[...scrapingExportsQueryKeys.all, 'status', exportType, scope] as const,
};

export function useScrapingExportStatus(exportType: ScrapingExportType) {
	const scope = useAbetScope();
	return useQuery({
		queryKey: scrapingExportsQueryKeys.status(exportType, scope),
		queryFn: () => getScrapingExportStatus(exportType),
		enabled: scope.academicPeriodId !== null,
		retry: false,
		refetchInterval: (query) =>
			query.state.data?.status === 'running' ? SCRAPING_EXPORT_POLL_INTERVAL_MS : false,
	});
}

interface RegenerateScrapingExportVariables {
	scope: AbetScope;
}

export function useRegenerateScrapingExport(exportType: ScrapingExportType) {
	const queryClient = useQueryClient();

	return useMutation<ScrapingExportStatusResponse, unknown, RegenerateScrapingExportVariables>({
		mutationFn: () => regenerateScrapingExport(exportType),
		// Scope comes from the mutation's own variables, not a closure over the hook's render-time
		// props — otherwise switching the top-bar period while a regenerate is in flight would
		// invalidate the newly-selected period's cache entry instead of the one actually mutated.
		onSettled: (_data, _error, { scope }) => {
			queryClient.invalidateQueries({
				queryKey: scrapingExportsQueryKeys.status(exportType, scope),
			});
		},
	});
}
