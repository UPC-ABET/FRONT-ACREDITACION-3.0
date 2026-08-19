'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription, Badge, Button, Card, Spinner, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useI18n } from '@/providers';
import {
	DIRECT_DOWNLOAD_EXPORT_KINDS,
	downloadGradesRcExport,
	downloadScrapingExport,
} from '../services';
import {
	isTerminalGradesRcStatus,
	useGradesRcExportStatus,
	useStartGradesRcExport,
} from '../hooks';
import type { DirectDownloadExportKind } from '../types';

// "Descargas" tab of /scrapping: builds the upload-ready Excels (docentes, secciones,
// matriculados, alumno-sección, notas RC) from the latest scrape runs and downloads them. The
// files line up with the uploads/* templates, so they can be fed straight into the load module.
export function ScrapingExportsView() {
	const { t, locale } = useI18n();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const [downloading, setDownloading] = useState<DirectDownloadExportKind | null>(null);
	const lang = locale === 'en' ? 'en' : 'es';

	const handleDownload = async (kind: DirectDownloadExportKind) => {
		setDownloading(kind);
		try {
			await downloadScrapingExport(kind, lang);
			showToast(t('scraping.exports.downloaded'), 'success');
		} catch (error) {
			handleError(error, 'scraping.exports.downloadFailed');
		} finally {
			setDownloading(null);
		}
	};

	// Grades RC's merge query can run well past a synchronous request, so it's a background job:
	// start it, poll its status, and only download once the backend reports it done.
	const [gradesRcJobId, setGradesRcJobId] = useState<string | null>(null);
	const [gradesRcDownloading, setGradesRcDownloading] = useState(false);
	const startGradesRcExport = useStartGradesRcExport();
	const gradesRcStatusQuery = useGradesRcExportStatus(gradesRcJobId);
	const gradesRcStatus = gradesRcStatusQuery.data ?? null;
	const gradesRcRunning =
		gradesRcJobId !== null && !isTerminalGradesRcStatus(gradesRcStatus?.status);

	const handleStartGradesRcExport = () => {
		startGradesRcExport.mutate(lang, {
			onSuccess: (data) => {
				if (!data.accepted || !data.jobId) {
					handleError(new Error('error.generic'), 'scraping.exports.notasRc.startFailed');
					return;
				}
				setGradesRcJobId(data.jobId);
			},
			onError: (error) => handleError(error, 'scraping.exports.notasRc.startFailed'),
		});
	};

	const handleDownloadGradesRcExport = async () => {
		if (!gradesRcJobId) return;
		setGradesRcDownloading(true);
		try {
			await downloadGradesRcExport(gradesRcJobId);
			showToast(t('scraping.exports.downloaded'), 'success');
		} catch (error) {
			handleError(error, 'scraping.exports.downloadFailed');
		} finally {
			setGradesRcDownloading(false);
		}
	};

	return (
		<div className="w-full space-y-4">
			<Card title={t('scraping.exports.title')} description={t('scraping.exports.subtitle')}>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{DIRECT_DOWNLOAD_EXPORT_KINDS.map((kind) => (
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

					<div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<p className="text-sm font-semibold text-zinc-800">
									{t('scraping.exports.items.notasRc.title')}
								</p>
								{gradesRcStatus?.status === 'failed' && (
									<Badge variant="danger">{t('scraping.exports.notasRc.badgeFailed')}</Badge>
								)}
								{gradesRcStatus?.status === 'completed' && (
									<Badge variant="success">{t('scraping.exports.notasRc.badgeCompleted')}</Badge>
								)}
								{gradesRcRunning && (
									<Badge variant="default">{t('scraping.exports.notasRc.badgeRunning')}</Badge>
								)}
							</div>
							<p className="text-xs text-zinc-500">
								{t('scraping.exports.items.notasRc.description')}
							</p>
							{gradesRcRunning && (
								<p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
									<Spinner size="sm" />
									{t('scraping.exports.notasRc.statusRunning')}
								</p>
							)}
							{gradesRcStatus?.status === 'failed' && (
								<Alert variant="destructive" className="mt-2">
									<AlertDescription>
										{gradesRcStatus.errorMessage
											? gradesRcStatus.errorMessage
											: t('scraping.exports.notasRc.statusFailed')}
									</AlertDescription>
								</Alert>
							)}
						</div>

						{gradesRcStatus?.status === 'completed' ? (
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="ghost"
									onClick={handleStartGradesRcExport}
									loading={startGradesRcExport.isPending}>
									<ArrowPathIcon className="h-4 w-4" />
									{t('scraping.exports.notasRc.regenerate')}
								</Button>
								<Button
									variant="secondary"
									onClick={handleDownloadGradesRcExport}
									loading={gradesRcDownloading}>
									<ArrowDownTrayIcon className="h-4 w-4" />
									{t('scraping.exports.notasRc.downloadFile')}
								</Button>
							</div>
						) : (
							<Button
								variant="secondary"
								onClick={handleStartGradesRcExport}
								loading={startGradesRcExport.isPending}
								disabled={gradesRcRunning}>
								{gradesRcStatus?.status === 'failed' ? (
									<ArrowPathIcon className="h-4 w-4" />
								) : (
									<ArrowDownTrayIcon className="h-4 w-4" />
								)}
								{gradesRcStatus?.status === 'failed'
									? t('scraping.exports.notasRc.retry')
									: t('scraping.exports.notasRc.generate')}
							</Button>
						)}
					</div>
				</div>
			</Card>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
