import { TYPE_CODES } from '@/shared/constants';
import type { ScrapingExportKind } from '../types';

export const SCRAPING_EXPORT_BY_UPLOAD_TYPE: Record<string, ScrapingExportKind> = {
	[TYPE_CODES.UPLOAD_TYPE.STAFF]: 'docentes',
	[TYPE_CODES.UPLOAD_TYPE.SECTIONS]: 'secciones',
	[TYPE_CODES.UPLOAD_TYPE.ENROLLED_STUDENTS]: 'alumnosMatriculados',
	[TYPE_CODES.UPLOAD_TYPE.STUDENT_SECTIONS]: 'alumnosSecciones',
};

export function scrapingExportForUploadType(typeCode: string): ScrapingExportKind | undefined {
	return SCRAPING_EXPORT_BY_UPLOAD_TYPE[typeCode];
}
