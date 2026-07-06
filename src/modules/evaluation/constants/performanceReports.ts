import type { PerformanceReportKind } from '../types';

export const PERFORMANCE_REPORTS_BASE_PATH = '/evaluation/semaphore-reports';

export const PERFORMANCE_REPORT_KINDS = {
	RC: 'rc',
	RV: 'rv',
} as const satisfies Record<string, PerformanceReportKind>;

export const PERFORMANCE_REPORT_FORMAT_ACCEPT = {
	pdf: 'application/pdf',
	excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;
