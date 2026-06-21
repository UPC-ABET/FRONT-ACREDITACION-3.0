// The four upload-ready Excels the backend builds from the raw scrape data
// (see BACK scraping-exports module). Each maps to a GET endpoint that streams an .xlsx.
export type ScrapingExportKind =
	| 'docentes'
	| 'secciones'
	| 'alumnosMatriculados'
	| 'alumnosSecciones';
