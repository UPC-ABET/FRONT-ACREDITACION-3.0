export type ScrapingExportType =
	| 'staff'
	| 'sections'
	| 'enrolledStudents'
	| 'studentSections'
	| 'gradesRc';

export type ScrapingExportRunStatus = 'running' | 'completed' | 'failed';

export interface ScrapingExportGenerated {
	exportType: ScrapingExportType;
	period: string;
	lang: string;
	status: ScrapingExportRunStatus;
	fileName: string | null;
	errorMessage: string | null;
	startedAt: string | null;
	finishedAt: string | null;
}

export type ScrapingExportStatusResponse = { status: 'notGenerated' } | ScrapingExportGenerated;

export function isScrapingExportGenerated(
	response: ScrapingExportStatusResponse,
): response is ScrapingExportGenerated {
	return response.status !== 'notGenerated';
}

// Download always serves the last *successfully* generated file, independent of the current
// run's status (see docs/CONTEXT.md § Business Rules) — so this is gated on `fileName`, not on
// `status === 'completed'`.
export function isScrapingExportDownloadable(response: ScrapingExportStatusResponse): boolean {
	return isScrapingExportGenerated(response) && response.fileName !== null;
}
