import type { SemaphoreColor, SemaphoreReportKind } from '../types';

export const SEMAPHORE_REPORTS_BASE_PATH = '/evaluation/semaphore-reports';

export const SEMAPHORE_REPORT_KINDS = {
	RC: 'rc',
	RV: 'rv',
} as const satisfies Record<string, SemaphoreReportKind>;

export const SEMAPHORE_REPORT_FORMAT_ACCEPT = {
	pdf: 'application/pdf',
	excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

// Backend already classifies every row into a semaphore color; the frontend only maps that
// classification to its display style. The hex values mirror the PDF/Excel exports so the
// on-screen report stays visually consistent with the downloaded files.
export const SEMAPHORE_COLOR_STYLES: Record<
	SemaphoreColor,
	{ dotHex: string; cellClassName: string }
> = {
	ROJO: { dotHex: '#dc2626', cellClassName: 'bg-red-100' },
	AMARILLO: { dotHex: '#eab308', cellClassName: 'bg-yellow-100' },
	VERDE: { dotHex: '#16a34a', cellClassName: 'bg-emerald-100' },
};
