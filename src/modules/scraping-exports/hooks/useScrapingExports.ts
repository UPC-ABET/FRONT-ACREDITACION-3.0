'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AbetScope, useAbetScope } from '@/modules/academic';
import { getScrapingExportStatus, regenerateScrapingExport } from '../services';
import type { ScrapingExportStatusResponse, ScrapingExportType } from '../types';

const SCRAPING_EXPORT_POLL_INTERVAL_MS = 5_000;

export const scrapingExportsQueryKeys = {
	all: ['scraping-exports'] as const,
	status: (exportType: ScrapingExportType, scope: AbetScope, lang: string) =>
		[...scrapingExportsQueryKeys.all, 'status', exportType, scope, lang] as const,
};

export function useScrapingExportStatus(exportType: ScrapingExportType, lang: 'es' | 'en') {
	const scope = useAbetScope();
	return useQuery({
		queryKey: scrapingExportsQueryKeys.status(exportType, scope, lang),
		queryFn: () => getScrapingExportStatus(exportType, lang),
		enabled: scope.academicPeriodId !== null,
		retry: false,
		refetchInterval: (query) =>
			query.state.data?.status === 'running' ? SCRAPING_EXPORT_POLL_INTERVAL_MS : false,
	});
}

interface RegenerateScrapingExportVariables {
	lang: 'es' | 'en';
	scope: AbetScope;
}

export function useRegenerateScrapingExport(exportType: ScrapingExportType) {
	const queryClient = useQueryClient();

	return useMutation<ScrapingExportStatusResponse, unknown, RegenerateScrapingExportVariables>({
		mutationFn: ({ lang }) => regenerateScrapingExport(exportType, lang),
		// Scope comes from the mutation's own variables, not a closure over the hook's render-time
		// props — otherwise switching the top-bar period while a regenerate is in flight would
		// invalidate the newly-selected period's cache entry instead of the one actually mutated.
		onSettled: (_data, _error, { lang, scope }) => {
			queryClient.invalidateQueries({
				queryKey: scrapingExportsQueryKeys.status(exportType, scope, lang),
			});
		},
	});
}
