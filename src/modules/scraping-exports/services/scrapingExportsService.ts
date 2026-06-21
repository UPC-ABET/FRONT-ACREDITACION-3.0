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

export async function downloadScrapingExport(
	kind: ScrapingExportKind,
	lang: 'es' | 'en' = 'es',
): Promise<void> {
	const { path, fallbackFileName } = EXPORTS[kind];
	const { blob, response } = await apiGetBlobResponse(`${path}?lang=${lang}`);
	triggerBlobDownload(blob, resolveDownloadFileName(response, fallbackFileName));
}
