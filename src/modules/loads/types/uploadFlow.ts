// Maps a backend upload type code (TG1101-T00X) to the per-flow REST endpoints.
// Upload paths are still per-slug since the backend keeps one route per concept.
export interface UploadFlow {
	typeCode: string;
	slug: string;
	uploadPath: string;
	templatePath: string;
	rollbackPath: string;
}
