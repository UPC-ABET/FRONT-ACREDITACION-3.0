import type { SemaphoreReportKind } from '../types';

export const SEMAPHORE_REPORTS_BASE_PATH = '/evaluation/semaphore-reports';

export const SEMAPHORE_REPORT_KINDS = {
	RC: 'rc',
	RV: 'rv',
} as const satisfies Record<string, SemaphoreReportKind>;

export const SEMAPHORE_REPORT_FORMAT_ACCEPT = {
	pdf: 'application/pdf',
	excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;
