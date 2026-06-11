export interface UploadResult {
	success: boolean;
	message: string | null;
	uploadLogId: number | null;
	totalRows: number;
	loadedRows: number;
	errorRows: number;
	excelWithErrors: string | null;
	fileName: string | null;
}

export interface UploadPayload {
	file: File;
	userId?: number;
	lang?: 'es' | 'en';
}

export interface RollbackPayload {
	uploadLogId: number;
}
