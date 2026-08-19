import { TYPE_CODES } from '@/shared/constants';
import type { DirectDownloadExportKind } from '../types';

export const SCRAPING_EXPORT_BY_UPLOAD_TYPE: Record<string, DirectDownloadExportKind> = {
	[TYPE_CODES.UPLOAD_TYPE.STAFF]: 'docentes',
	[TYPE_CODES.UPLOAD_TYPE.SECTIONS]: 'secciones',
	[TYPE_CODES.UPLOAD_TYPE.ENROLLED_STUDENTS]: 'alumnosMatriculados',
	[TYPE_CODES.UPLOAD_TYPE.STUDENT_SECTIONS]: 'alumnosSecciones',
};

export function scrapingExportForUploadType(
	typeCode: string,
): DirectDownloadExportKind | undefined {
	return SCRAPING_EXPORT_BY_UPLOAD_TYPE[typeCode];
}
