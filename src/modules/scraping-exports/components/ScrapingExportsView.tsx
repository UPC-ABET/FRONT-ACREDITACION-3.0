'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button, Card, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import { SCRAPING_EXPORT_KINDS, downloadScrapingExport } from '../services';
import type { ScrapingExportKind } from '../types';

// "Descargas" tab of /scrapping: builds the upload-ready Excels (docentes, secciones,
// matriculados, alumno-sección) from the latest scrape runs and downloads them. The files line up
// with the uploads/* templates, so they can be fed straight into the load module.
export function ScrapingExportsView() {
	const { t, locale } = useI18n();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const [downloading, setDownloading] = useState<ScrapingExportKind | null>(null);

	const handleDownload = async (kind: ScrapingExportKind) => {
		setDownloading(kind);
		try {
			await downloadScrapingExport(kind, locale === 'en' ? 'en' : 'es');
			showToast(t('scraping.exports.downloaded'), 'success');
		} catch (error) {
			handleError(error, 'scraping.exports.downloadFailed');
		} finally {
			setDownloading(null);
		}
	};

	return (
		<div className="w-full space-y-4">
			<Card title={t('scraping.exports.title')} description={t('scraping.exports.subtitle')}>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{SCRAPING_EXPORT_KINDS.map((kind) => (
						<div
							key={kind}
							className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
							<div className="min-w-0">
								<p className="text-sm font-semibold text-zinc-800">
									{t(`scraping.exports.items.${kind}.title`)}
								</p>
								<p className="text-xs text-zinc-500">
									{t(`scraping.exports.items.${kind}.description`)}
								</p>
							</div>
							<Button
								variant="secondary"
								onClick={() => handleDownload(kind)}
								loading={downloading === kind}
								disabled={downloading !== null}>
								<ArrowDownTrayIcon className="h-4 w-4" />
								{t('scraping.exports.download')}
							</Button>
						</div>
					))}
				</div>
			</Card>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
