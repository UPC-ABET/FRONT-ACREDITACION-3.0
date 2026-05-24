'use client';

import { useCallback, useState } from 'react';
import { useI18n } from '@/providers';
import { getErrorMessage } from '@/shared/lib/api-error';
import { triggerBrowserDownload } from '@/shared/utils';
import { downloadStatusReport } from '../services/ifcsStatusReportService';

export function useStatusReportDownload() {
	const { locale } = useI18n();
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const download = useCallback(
		async (chartIds: number[], periodId: number) => {
			if (chartIds.length === 0 || periodId == null) return;
			setDownloading(true);
			setError(null);
			try {
				const { blob, filename } = await downloadStatusReport(
					chartIds,
					periodId,
					locale as 'es' | 'en',
				);
				triggerBrowserDownload(blob, filename);
			} catch (e: unknown) {
				setError(getErrorMessage(e, 'ifcs.statusReport.error.downloadFailed'));
			} finally {
				setDownloading(false);
			}
		},
		[locale],
	);

	const clearError = useCallback(() => setError(null), []);

	return { download, downloading, error, clearError };
}
