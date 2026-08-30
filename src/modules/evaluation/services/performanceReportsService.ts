import type { ApiResponse } from '@/shared';
import { apiPost, apiPostBlobResponse } from '@/shared/lib';
import { resolveDownloadFileName } from '@/shared/lib/fileDownload';
import {
	PERFORMANCE_REPORT_FORMAT_ACCEPT,
	PERFORMANCE_REPORTS_BASE_PATH,
} from '../constants/performanceReports';
import type {
	PerformanceReportDto,
	PerformanceReportFilterDto,
	PerformanceReportFormat,
	PerformanceReportKind,
} from '../types';

function reportPath(kind: PerformanceReportKind): string {
	return `${PERFORMANCE_REPORTS_BASE_PATH}/${kind}`;
}

function downloadPath(kind: PerformanceReportKind, format: PerformanceReportFormat): string {
	return `${reportPath(kind)}/${format}`;
}

function fallbackFileName(
	kind: PerformanceReportKind,
	format: PerformanceReportFormat,
	lang: PerformanceReportFilterDto['lang'],
): string {
	// Mirror the backend's user-facing naming: RC = Control, RV = Verification.
	const names: Record<PerformanceReportKind, { es: string; en: string }> = {
		rc: { es: 'Reporte_Control_RC', en: 'Control_Report_RC' },
		rv: { es: 'Reporte_Verificacion_RV', en: 'Verification_Report_RV' },
	};
	const prefix = lang === 'en' ? names[kind].en : names[kind].es;
	// RC's "PDF" download is always a zip -- one PDF per outcome (see the backend's
	// generateRcZipDownload). RV's stays a single PDF.
	const extension = format === 'excel' ? 'xlsx' : kind === 'rc' ? 'zip' : 'pdf';
	return `${prefix}.${extension}`;
}

export const performanceReportsService = {
	getReport(
		kind: PerformanceReportKind,
		filters: PerformanceReportFilterDto,
	): Promise<PerformanceReportDto> {
		return apiPost<ApiResponse<PerformanceReportDto>>(reportPath(kind), filters).then(
			(response) => response.data,
		);
	},

	async downloadReport(
		kind: PerformanceReportKind,
		format: PerformanceReportFormat,
		filters: PerformanceReportFilterDto,
	): Promise<{ blob: Blob; filename: string }> {
		const { blob, response } = await apiPostBlobResponse(downloadPath(kind, format), filters, {
			accept: PERFORMANCE_REPORT_FORMAT_ACCEPT[format],
		});
		const filename = resolveDownloadFileName(
			response,
			fallbackFileName(kind, format, filters.lang),
		);
		return { blob, filename };
	},
};
