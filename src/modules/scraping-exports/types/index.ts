// The five upload-ready Excels the backend builds from the raw scrape data
// (see BACK scraping-exports module). `notasRc` is generated as a background job (see
// GradesRcExportJobStatus below); the other four stream their .xlsx directly on GET.
export type ScrapingExportKind =
	| 'docentes'
	| 'secciones'
	| 'alumnosMatriculados'
	| 'alumnosSecciones'
	| 'notasRc';

export type DirectDownloadExportKind = Exclude<ScrapingExportKind, 'notasRc'>;

export type GradesRcExportStatus = 'running' | 'completed' | 'failed';

// The grades-rc export's merge query can run well past any HTTP/gateway timeout, so the
// backend runs it as a background job instead of streaming the file synchronously.
export interface GradesRcExportJobStatus {
	status: GradesRcExportStatus;
	done: boolean;
	fileName: string | null;
	errorMessage: string | null;
}
