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

function buildUrl(
	exportType: ScrapingExportType,
	action: 'status' | 'download' | 'regenerate',
	lang: 'es' | 'en',
) {
	return `/scraping/exports/${EXPORT_TYPE_PATH[exportType]}/${action}?lang=${encodeURIComponent(lang)}`;
}

// The backend's wire field is `periodo` (Spanish), and only `status` is guaranteed present —
// this maps the raw response to the frontend's typed, English-named, defensively-defaulted
// shape rather than trusting the JSON to already match it.
interface ScrapingExportStatusWire {
	status?: string;
	periodo?: string;
	fileName?: string | null;
	errorMessage?: string | null;
	startedAt?: string | null;
	finishedAt?: string | null;
}

function normalizeStatusResponse(
	raw: unknown,
	exportType: ScrapingExportType,
	lang: 'es' | 'en',
): ScrapingExportStatusResponse {
	const wire = raw as ScrapingExportStatusWire;
	if (!wire.status || wire.status === 'notGenerated') return { status: 'notGenerated' };
	return {
		exportType,
		period: wire.periodo ?? '',
		lang,
		status: wire.status as ScrapingExportRunStatus,
		fileName: wire.fileName ?? null,
		errorMessage: wire.errorMessage ?? null,
		startedAt: wire.startedAt ?? null,
		finishedAt: wire.finishedAt ?? null,
	};
}

export async function getScrapingExportStatus(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiGet(buildUrl(exportType, 'status', lang));
	return normalizeStatusResponse(getApiData<unknown>(res), exportType, lang);
}

export async function regenerateScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiPost(buildUrl(exportType, 'regenerate', lang));
	return normalizeStatusResponse(getApiData<unknown>(res), exportType, lang);
}

export async function downloadScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<void> {
	const { blob, response } = await apiGetBlobResponse(buildUrl(exportType, 'download', lang));
	triggerBlobDownload(
		blob,
		resolveDownloadFileName(response, EXPORT_FALLBACK_FILE_NAME[exportType]),
	);
}
