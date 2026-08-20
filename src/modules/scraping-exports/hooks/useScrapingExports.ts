'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getScrapingExportStatus, regenerateScrapingExport } from '../services';
import type { ScrapingExportStatusResponse, ScrapingExportType } from '../types';

const SCRAPING_EXPORT_POLL_INTERVAL_MS = 5_000;

export const scrapingExportsQueryKeys = {
	all: ['scraping-exports'] as const,
	status: (
		exportType: ScrapingExportType,
		schoolId: number | null,
		modalityTypeId: number | null,
		academicPeriodId: number | null,
		lang: string,
	) =>
		[
			...scrapingExportsQueryKeys.all,
			'status',
			exportType,
			schoolId,
			modalityTypeId,
			academicPeriodId,
			lang,
		] as const,
};

export function useScrapingExportStatus(
	exportType: ScrapingExportType,
	schoolId: number | null,
	modalityTypeId: number | null,
	academicPeriodId: number | null,
	lang: 'es' | 'en',
) {
	return useQuery({
		queryKey: scrapingExportsQueryKeys.status(
			exportType,
			schoolId,
			modalityTypeId,
			academicPeriodId,
			lang,
		),
		queryFn: () => getScrapingExportStatus(exportType, lang),
		enabled: academicPeriodId !== null,
		refetchInterval: (query) =>
			query.state.data?.status === 'running' ? SCRAPING_EXPORT_POLL_INTERVAL_MS : false,
	});
}

export function useRegenerateScrapingExport(
	exportType: ScrapingExportType,
	schoolId: number | null,
	modalityTypeId: number | null,
	academicPeriodId: number | null,
) {
	const queryClient = useQueryClient();

	return useMutation<ScrapingExportStatusResponse, unknown, 'es' | 'en'>({
		mutationFn: (lang) => regenerateScrapingExport(exportType, lang),
		onSettled: (_data, _error, lang) => {
			queryClient.invalidateQueries({
				queryKey: scrapingExportsQueryKeys.status(
					exportType,
					schoolId,
					modalityTypeId,
					academicPeriodId,
					lang,
				),
			});
		},
	});
}
