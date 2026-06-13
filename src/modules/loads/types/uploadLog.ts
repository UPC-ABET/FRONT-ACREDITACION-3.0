import type { I18nText } from '@/shared/types';

export interface UploadLogTypeRef {
	code: string;
	name: I18nText;
}

export interface UploadLogStatusRef {
	code: string;
	name: I18nText;
}

export interface UploadLogUser {
	id: number;
	fullName: string;
	email: string;
}

export interface UploadLog {
	id: number;
	uploadType: UploadLogTypeRef;
	status: UploadLogStatusRef;
	academicPeriodId: number | null;
	user: UploadLogUser | null;
	sourceFile: string | null;
	totalRows: number | null;
	loadedRows: number | null;
	errorRows: number | null;
	createdAt: string;
	rollbackAt: string | null;
}

export interface UploadLogFilters {
	uploadTypeCode?: string;
	statusCode?: string;
	academicPeriodId?: number;
	page?: number;
	pageSize?: number;
}

export interface UploadLogPage {
	items: UploadLog[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface ParsedErrorRow {
	rowNumber: number;
	messages: string[];
	cells: Record<string, string>;
}
