import {
	apiGet,
	apiGetBlobResponse,
	apiPost,
	getApiData,
	resolveDownloadFileName,
	triggerBlobDownload,
} from '@/shared/lib/apiClient';
import { EXPORT_FALLBACK_FILE_NAME, EXPORT_TYPE_PATH } from '../constants';
import type { ScrapingExportStatusResponse, ScrapingExportType } from '../types';

function buildUrl(
	exportType: ScrapingExportType,
	action: 'status' | 'download' | 'regenerate',
	lang: 'es' | 'en',
) {
	return `/scraping/exports/${EXPORT_TYPE_PATH[exportType]}/${action}?lang=${encodeURIComponent(lang)}`;
}

// The backend DTO only marks `status` as required — normalize the rest to the guaranteed-present
// shape the frontend types declare, rather than trusting every field to always be sent.
function normalizeStatusResponse(raw: ScrapingExportStatusResponse): ScrapingExportStatusResponse {
	if (raw.status === 'notGenerated') return raw;
	return {
		...raw,
		fileName: raw.fileName ?? null,
		errorMessage: raw.errorMessage ?? null,
		startedAt: raw.startedAt ?? null,
		finishedAt: raw.finishedAt ?? null,
	};
}

export async function getScrapingExportStatus(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiGet(buildUrl(exportType, 'status', lang));
	return normalizeStatusResponse(getApiData<ScrapingExportStatusResponse>(res));
}

export async function regenerateScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiPost(buildUrl(exportType, 'regenerate', lang));
	return normalizeStatusResponse(getApiData<ScrapingExportStatusResponse>(res));
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
