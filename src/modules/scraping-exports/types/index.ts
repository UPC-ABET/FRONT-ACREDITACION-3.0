export type ScrapingExportType =
	| 'staff'
	| 'sections'
	| 'enrolledStudents'
	| 'studentSections'
	| 'gradesRc';

export type ScrapingExportRunStatus = 'running' | 'completed' | 'failed';

export interface ScrapingExportGenerated {
	exportType: ScrapingExportType;
	periodo: string;
	lang: string;
	status: ScrapingExportRunStatus;
	fileName: string | null;
	errorMessage: string | null;
	startedAt: string | null;
	finishedAt: string | null;
}

export type ScrapingExportStatusResponse = { status: 'notGenerated' } | ScrapingExportGenerated;
