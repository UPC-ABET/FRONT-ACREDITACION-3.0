import type { ApiResponse } from '@/shared';
import { apiPost, apiPostBlobResponse } from '@/shared/lib';
import { resolveDownloadFileName } from '@/shared/lib/fileDownload';
import {
	SEMAPHORE_REPORT_FORMAT_ACCEPT,
	SEMAPHORE_REPORTS_BASE_PATH,
} from '../constants/semaphore';
import type {
	SemaphoreFilterDto,
	SemaphoreReportDto,
	SemaphoreReportFormat,
	SemaphoreReportKind,
} from '../types';

function reportPath(kind: SemaphoreReportKind): string {
	return `${SEMAPHORE_REPORTS_BASE_PATH}/${kind}`;
}

function downloadPath(kind: SemaphoreReportKind, format: SemaphoreReportFormat): string {
	return `${reportPath(kind)}/${format}`;
}

function fallbackFileName(
	kind: SemaphoreReportKind,
	format: SemaphoreReportFormat,
	lang: SemaphoreFilterDto['lang'],
): string {
	const prefix = lang === 'en' ? 'Semaphore_Report' : 'Reporte_Semaforo';
	const extension = format === 'pdf' ? 'pdf' : 'xlsx';
	return `${prefix}_${kind.toUpperCase()}.${extension}`;
}

export const semaphoreReportsService = {
	getReport(kind: SemaphoreReportKind, filters: SemaphoreFilterDto): Promise<SemaphoreReportDto> {
		return apiPost<ApiResponse<SemaphoreReportDto>>(reportPath(kind), filters).then(
			(response) => response.data,
		);
	},

	async downloadReport(
		kind: SemaphoreReportKind,
		format: SemaphoreReportFormat,
		filters: SemaphoreFilterDto,
	): Promise<{ blob: Blob; filename: string }> {
		const { blob, response } = await apiPostBlobResponse(downloadPath(kind, format), filters, {
			accept: SEMAPHORE_REPORT_FORMAT_ACCEPT[format],
		});
		const filename = resolveDownloadFileName(
			response,
			fallbackFileName(kind, format, filters.lang),
		);
		return { blob, filename };
	},
};
