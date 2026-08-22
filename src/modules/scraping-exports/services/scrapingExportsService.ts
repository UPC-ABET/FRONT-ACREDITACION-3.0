import {
	apiGet,
	apiGetBlobResponse,
	apiPost,
	getApiData,
	resolveDownloadFileName,
	triggerBlobDownload,
} from '@/shared/lib/apiClient';
import { EXPORT_FALLBACK_FILE_NAME, EXPORT_TYPE_PATH } from '../constants';
import type {
	ScrapingExportRunStatus,
	ScrapingExportStatusResponse,
	ScrapingExportType,
} from '../types';

function buildUrl(exportType: ScrapingExportType, action: 'status' | 'regenerate') {
	return `/scraping/exports/${EXPORT_TYPE_PATH[exportType]}/${action}`;
}

function buildDownloadUrl(exportType: ScrapingExportType, lang: 'es' | 'en') {
	return `/scraping/exports/${EXPORT_TYPE_PATH[exportType]}/download?lang=${encodeURIComponent(lang)}`;
}

// The backend's wire field is `period` (English, as of PR #124), and only `status` is
// guaranteed present — this maps the raw response to the frontend's typed,
// defensively-defaulted shape rather than trusting the JSON to already match it.
interface ScrapingExportStatusWire {
	status?: string;
	period?: string;
	fileName?: string | null;
	errorMessage?: string | null;
	startedAt?: string | null;
	finishedAt?: string | null;
}

function normalizeStatusResponse(
	raw: unknown,
	exportType: ScrapingExportType,
): ScrapingExportStatusResponse {
	const wire = raw as ScrapingExportStatusWire;
	if (!wire.status || wire.status === 'notGenerated') return { status: 'notGenerated' };
	return {
		exportType,
		period: wire.period ?? '',
		status: wire.status as ScrapingExportRunStatus,
		fileName: wire.fileName ?? null,
		errorMessage: wire.errorMessage ?? null,
		startedAt: wire.startedAt ?? null,
		finishedAt: wire.finishedAt ?? null,
	};
}

export async function getScrapingExportStatus(
	exportType: ScrapingExportType,
): Promise<ScrapingExportStatusResponse> {
	const res = await apiGet(buildUrl(exportType, 'status'));
	return normalizeStatusResponse(getApiData<unknown>(res), exportType);
}

export async function regenerateScrapingExport(
	exportType: ScrapingExportType,
): Promise<ScrapingExportStatusResponse> {
	const res = await apiPost(buildUrl(exportType, 'regenerate'));
	return normalizeStatusResponse(getApiData<unknown>(res), exportType);
}

export async function downloadScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<void> {
	const { blob, response } = await apiGetBlobResponse(buildDownloadUrl(exportType, lang));
	triggerBlobDownload(
		blob,
		resolveDownloadFileName(response, EXPORT_FALLBACK_FILE_NAME[exportType]),
	);
}
