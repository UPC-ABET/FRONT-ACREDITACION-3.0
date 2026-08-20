'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Alert, AlertDescription, Badge, Button, Card, Spinner, Toast } from '@/shared/components';
import { useApiErrorToast } from '@/shared/hooks';
import { useABET, useI18n } from '@/providers';
import { EXPORT_FALLBACK_FILE_NAME, SCRAPING_EXPORT_TYPES } from '../constants';
import { useRegenerateScrapingExport, useScrapingExportStatus } from '../hooks';
import { downloadScrapingExport } from '../services';
import type {
	ScrapingExportGenerated,
	ScrapingExportStatusResponse,
	ScrapingExportType,
} from '../types';

function isGenerated(response: ScrapingExportStatusResponse): response is ScrapingExportGenerated {
	return response.status !== 'notGenerated';
}

interface ScrapingExportCardProps {
	exportType: ScrapingExportType;
	lang: 'es' | 'en';
	schoolId: number | null;
	modalityTypeId: number | null;
	academicPeriodId: number | null;
	onDownloaded: () => void;
	onError: (error: unknown, fallbackKey?: string) => void;
}

// One card per export type, all driven by the same generic status/regenerate/download contract.
// Download stays available whenever a successful file exists (`fileName !== null`), independent
// of the current run's status — that's what lets it keep serving the previous file while a
// regenerate is in flight.
function ScrapingExportCard({
	exportType,
	lang,
	schoolId,
	modalityTypeId,
	academicPeriodId,
	onDownloaded,
	onError,
}: ScrapingExportCardProps) {
	const { t } = useI18n();
	const [downloading, setDownloading] = useState(false);
	const statusQuery = useScrapingExportStatus(
		exportType,
		schoolId,
		modalityTypeId,
		academicPeriodId,
		lang,
	);
	const regenerate = useRegenerateScrapingExport(
		exportType,
		schoolId,
		modalityTypeId,
		academicPeriodId,
	);

	const data = statusQuery.data;
	const status = data?.status ?? null;
	const generated = data && isGenerated(data) ? data : null;
	const canDownload = generated !== null && generated.fileName !== null;
	const running = status === 'running';

	const handleDownload = async () => {
		setDownloading(true);
		try {
			await downloadScrapingExport(exportType, lang, EXPORT_FALLBACK_FILE_NAME[exportType]);
			onDownloaded();
		} catch (error) {
			onError(error, 'scraping.exports.actions.downloadFailed');
		} finally {
			setDownloading(false);
		}
	};

	const handleRegenerate = () => {
		regenerate.mutate(lang, {
			onError: (error) => onError(error, 'scraping.exports.actions.startFailed'),
		});
	};

	return (
		<div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="min-w-0">
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-sm font-semibold text-zinc-800">
						{t(`scraping.exports.items.${exportType}.title`)}
					</p>
					{status === 'failed' && (
						<Badge variant="danger">{t('scraping.exports.actions.badgeFailed')}</Badge>
					)}
					{status === 'completed' && (
						<Badge variant="success">{t('scraping.exports.actions.badgeCompleted')}</Badge>
					)}
					{running && <Badge variant="default">{t('scraping.exports.actions.badgeRunning')}</Badge>}
				</div>
				<p className="text-xs text-zinc-500">
					{t(`scraping.exports.items.${exportType}.description`)}
				</p>
				{running && (
					<p className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
						<Spinner size="sm" />
						{t('scraping.exports.actions.statusRunning')}
					</p>
				)}
				{status === 'failed' && (
					<Alert variant="destructive" className="mt-2">
						<AlertDescription>
							{generated?.errorMessage
								? generated.errorMessage
								: t('scraping.exports.actions.statusFailed')}
						</AlertDescription>
					</Alert>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				{canDownload && (
					<Button
						variant="secondary"
						onClick={handleDownload}
						loading={downloading}
						disabled={downloading}>
						<ArrowDownTrayIcon className="h-4 w-4" />
						{t('scraping.exports.actions.download')}
					</Button>
				)}
				<Button
					variant={canDownload ? 'ghost' : 'secondary'}
					onClick={handleRegenerate}
					loading={regenerate.isPending}
					disabled={running || regenerate.isPending || statusQuery.isLoading}>
					<ArrowPathIcon className="h-4 w-4" />
					{status === 'failed'
						? t('scraping.exports.actions.retry')
						: canDownload
							? t('scraping.exports.actions.regenerate')
							: t('scraping.exports.actions.generate')}
				</Button>
			</div>
		</div>
	);
}

// "Descargas" tab of /scrapping: builds the upload-ready Excels (staff, sections, enrolled
// students, student-sections, grades RC) from the latest scrape runs and downloads them. The
// files line up with the uploads/* templates, so they can be fed straight into the load module.
export function ScrapingExportsView() {
	const { t, locale } = useI18n();
	const { schoolId, modalityTypeId, academicPeriodId } = useABET();
	const { toast, showToast, handleError, clearToast } = useApiErrorToast();
	const lang = locale === 'en' ? 'en' : 'es';

	return (
		<div className="w-full space-y-4">
			<Card title={t('scraping.exports.title')} description={t('scraping.exports.subtitle')}>
				{academicPeriodId === null ? (
					<Alert variant="warning">{t('scraping.exports.selectPeriod')}</Alert>
				) : (
					<div className="space-y-3">
						{SCRAPING_EXPORT_TYPES.map((exportType) => (
							<ScrapingExportCard
								key={exportType}
								exportType={exportType}
								lang={lang}
								schoolId={schoolId}
								modalityTypeId={modalityTypeId}
								academicPeriodId={academicPeriodId}
								onDownloaded={() => showToast(t('scraping.exports.actions.downloaded'), 'success')}
								onError={handleError}
							/>
						))}
					</div>
				)}
			</Card>

			<Toast isOpen={toast.isOpen} onClose={clearToast} type={toast.type} message={toast.message} />
		</div>
	);
}
