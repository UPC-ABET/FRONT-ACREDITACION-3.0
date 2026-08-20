import { TYPE_CODES } from '@/shared/constants';
import type { ScrapingExportType } from '../types';

export const SCRAPING_EXPORT_TYPES: ScrapingExportType[] = [
	'staff',
	'sections',
	'enrolledStudents',
	'studentSections',
	'gradesRc',
];

export const EXPORT_TYPE_PATH: Record<ScrapingExportType, string> = {
	staff: 'staff',
	sections: 'sections',
	enrolledStudents: 'enrolled-students',
	studentSections: 'student-sections',
	gradesRc: 'grades-rc',
};

export const EXPORT_FALLBACK_FILE_NAME: Record<ScrapingExportType, string> = {
	staff: 'Docentes.xlsx',
	sections: 'Secciones.xlsx',
	enrolledStudents: 'Matriculados.xlsx',
	studentSections: 'AlumnoSeccion.xlsx',
	gradesRc: 'NotasRC.xlsx',
};

export const SCRAPING_EXPORT_BY_UPLOAD_TYPE: Record<string, ScrapingExportType> = {
	[TYPE_CODES.UPLOAD_TYPE.STAFF]: 'staff',
	[TYPE_CODES.UPLOAD_TYPE.SECTIONS]: 'sections',
	[TYPE_CODES.UPLOAD_TYPE.ENROLLED_STUDENTS]: 'enrolledStudents',
	[TYPE_CODES.UPLOAD_TYPE.STUDENT_SECTIONS]: 'studentSections',
};

export function scrapingExportForUploadType(typeCode: string): ScrapingExportType | undefined {
	return SCRAPING_EXPORT_BY_UPLOAD_TYPE[typeCode];
}
