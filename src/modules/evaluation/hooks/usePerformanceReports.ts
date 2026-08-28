import { useMutation, useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/lib';
import { triggerBlobDownload } from '@/shared/lib/fileDownload';
import { performanceReportsService } from '../services/performanceReportsService';
import type {
	PerformanceReportFilterDto,
	PerformanceReportFormat,
	PerformanceReportKind,
} from '../types';

export const performanceReportKeys = {
	all: ['evaluation', 'performance-reports'] as const,
	// The active period travels in the X-Academic-Period-Id header, so it must be part of the
	// key — otherwise React Query would serve a cached report from a different period.
	report: (
		kind: PerformanceReportKind,
		academicPeriodId: number | null,
		filters: PerformanceReportFilterDto,
	) => [...performanceReportKeys.all, kind, academicPeriodId, filters] as const,
};

export function usePerformanceReport(
	kind: PerformanceReportKind,
	filters: PerformanceReportFilterDto,
	academicPeriodId: number | null,
	enabled: boolean,
) {
	return useQuery({
		queryKey: performanceReportKeys.report(kind, academicPeriodId, filters),
		queryFn: () => performanceReportsService.getReport(kind, filters),
		enabled: academicPeriodId != null && enabled,
		retry: false,
	});
}

export function usePerformanceReportDownload(kind: PerformanceReportKind) {
	return useMutation({
		mutationFn: ({
			format,
			filters,
		}: {
			format: PerformanceReportFormat;
			filters: PerformanceReportFilterDto;
		}) => performanceReportsService.downloadReport(kind, format, filters),
		onSuccess: ({ blob, filename }) => triggerBlobDownload(blob, filename),
		// A 503 is the backend's statement timeout on a heavy query, not a bad request: one
		// automatic retry is worth it. Every other status (400 single-campus, 404 no data) is
		// deterministic and must surface immediately.
		retry: (failureCount, error) =>
			error instanceof ApiError && error.status === 503 && failureCount < 1,
	});
}
