import {
	apiGet,
	apiGetBlobResponse,
	apiPost,
	getApiData,
	resolveDownloadFileName,
	triggerBlobDownload,
} from '@/shared/lib/apiClient';
import type { DirectDownloadExportKind, GradesRcExportJobStatus } from '../types';

const EXPORTS: Record<DirectDownloadExportKind, { path: string; fallbackFileName: string }> = {
	docentes: { path: '/scraping/exports/docentes', fallbackFileName: 'Docentes.xlsx' },
	secciones: { path: '/scraping/exports/secciones', fallbackFileName: 'Secciones.xlsx' },
	alumnosMatriculados: {
		path: '/scraping/exports/alumnos-matriculados',
		fallbackFileName: 'Matriculados.xlsx',
	},
	alumnosSecciones: {
		path: '/scraping/exports/alumnos-secciones',
		fallbackFileName: 'AlumnoSeccion.xlsx',
	},
};

export const DIRECT_DOWNLOAD_EXPORT_KINDS = Object.keys(EXPORTS) as DirectDownloadExportKind[];

export async function downloadScrapingExport(
	kind: DirectDownloadExportKind,
	lang: 'es' | 'en' = 'es',
): Promise<void> {
	const { path, fallbackFileName } = EXPORTS[kind];
	const { blob, response } = await apiGetBlobResponse(`${path}?lang=${lang}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, fallbackFileName));
}

const GRADES_RC_BASE_PATH = '/scraping/exports/grades-rc';
const GRADES_RC_FALLBACK_FILE_NAME = 'NotasRC.xlsx';

export async function startGradesRcExport(
	lang: 'es' | 'en' = 'es',
): Promise<{ accepted: boolean; jobId: string }> {
	const res = await apiPost(`${GRADES_RC_BASE_PATH}/start?lang=${lang}`);
	const data = getApiData<{ accepted?: boolean; jobId?: string }>(res);
	return { accepted: data?.accepted ?? false, jobId: data?.jobId ?? '' };
}

export async function getGradesRcExportStatus(jobId: string): Promise<GradesRcExportJobStatus> {
	const res = await apiGet(`${GRADES_RC_BASE_PATH}/status/${encodeURIComponent(jobId)}`);
	const data = getApiData<{
		status?: GradesRcExportJobStatus['status'];
		done?: boolean;
		fileName?: string | null;
		errorMessage?: string | null;
	}>(res);
	return {
		status: data?.status ?? 'running',
		done: data?.done ?? false,
		fileName: data?.fileName ?? null,
		errorMessage: data?.errorMessage ?? null,
	};
}

export async function downloadGradesRcExport(jobId: string): Promise<void> {
	const { blob, response } = await apiGetBlobResponse(
		`${GRADES_RC_BASE_PATH}/download/${encodeURIComponent(jobId)}`,
	);
	triggerBlobDownload(blob, resolveDownloadFileName(response, GRADES_RC_FALLBACK_FILE_NAME));
}
