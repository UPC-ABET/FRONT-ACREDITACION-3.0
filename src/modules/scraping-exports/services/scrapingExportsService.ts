import { apiGetBlobResponse } from '@/shared/lib/apiClient';
import { resolveDownloadFileName, triggerBlobDownload } from '@/shared/lib/fileDownload';
import type { ScrapingExportKind } from '../types';

const EXPORTS: Record<ScrapingExportKind, { path: string; fallbackFileName: string }> = {
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

export const SCRAPING_EXPORT_KINDS = Object.keys(EXPORTS) as ScrapingExportKind[];

// Upload-type code (TYPE_GROUP TG1101) -> the scraping export that produces that upload's file.
// Only these four upload types are backed by scraping; the rest have no web-scraping button.
export const SCRAPING_EXPORT_BY_UPLOAD_TYPE: Record<string, ScrapingExportKind> = {
	'TG1101-T001': 'docentes', // staff
	'TG1101-T005': 'secciones', // sections
	'TG1101-T006': 'alumnosMatriculados', // enrolled-students
	'TG1101-T010': 'alumnosSecciones', // student-sections
};

export function scrapingExportForUploadType(typeCode: string): ScrapingExportKind | undefined {
	return SCRAPING_EXPORT_BY_UPLOAD_TYPE[typeCode];
}

export async function downloadScrapingExport(
	kind: ScrapingExportKind,
	lang: 'es' | 'en' = 'es',
): Promise<void> {
	const { path, fallbackFileName } = EXPORTS[kind];
	const { blob, response } = await apiGetBlobResponse(`${path}?lang=${lang}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, fallbackFileName));
}
