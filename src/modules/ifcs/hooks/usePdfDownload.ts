'use client';

import { useCallback, useState } from 'react';
import { useI18n } from '@/providers';
import { triggerBrowserDownload } from '@/shared/utils';
import { downloadIfcPdf, downloadIfcPdfBulk } from '../services/ifcsPdfService';

export function usePdfDownload() {
	const { locale } = useI18n();
	const [downloadingId, setDownloadingId] = useState<number | null>(null);
	const [downloadingAll, setDownloadingAll] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const downloadOne = useCallback(
		async (ifcId: number) => {
			setDownloadingId(ifcId);
			setError(null);
			try {
				const { blob, filename } = await downloadIfcPdf(ifcId, locale as 'es' | 'en');
				triggerBrowserDownload(blob, filename);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : 'ifcs.pdf.error.downloadFailed';
				setError(msg);
			} finally {
				setDownloadingId(null);
			}
		},
		[locale],
	);

	const downloadMany = useCallback(
		async (ifcIds: number[]) => {
			if (ifcIds.length === 0) return;
			setDownloadingAll(true);
			setError(null);
			try {
				const { blob, filename } = await downloadIfcPdfBulk(ifcIds, locale as 'es' | 'en');
				triggerBrowserDownload(blob, filename);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : 'ifcs.pdf.error.bulkFailed';
				setError(msg);
			} finally {
				setDownloadingAll(false);
			}
		},
		[locale],
	);

	const clearError = useCallback(() => setError(null), []);

	return { downloadOne, downloadMany, downloadingId, downloadingAll, error, clearError };
}
