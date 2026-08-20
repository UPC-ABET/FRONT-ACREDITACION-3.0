import {
	apiGet,
	apiGetBlobResponse,
	apiPost,
	getApiData,
	resolveDownloadFileName,
	triggerBlobDownload,
} from '@/shared/lib/apiClient';
import { EXPORT_TYPE_PATH } from '../constants';
import type { ScrapingExportStatusResponse, ScrapingExportType } from '../types';

function exportPath(exportType: ScrapingExportType, action: 'status' | 'download' | 'regenerate') {
	return `/scraping/exports/${EXPORT_TYPE_PATH[exportType]}/${action}`;
}

export async function getScrapingExportStatus(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiGet(`${exportPath(exportType, 'status')}?lang=${lang}`);
	return getApiData<ScrapingExportStatusResponse>(res);
}

export async function regenerateScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
): Promise<ScrapingExportStatusResponse> {
	const res = await apiPost(`${exportPath(exportType, 'regenerate')}?lang=${lang}`);
	return getApiData<ScrapingExportStatusResponse>(res);
}

export async function downloadScrapingExport(
	exportType: ScrapingExportType,
	lang: 'es' | 'en' = 'es',
	fallbackFileName: string,
): Promise<void> {
	const { blob, response } = await apiGetBlobResponse(
		`${exportPath(exportType, 'download')}?lang=${lang}`,
	);
	triggerBlobDownload(blob, resolveDownloadFileName(response, fallbackFileName));
}
