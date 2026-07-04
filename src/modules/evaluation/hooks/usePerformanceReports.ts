import { useMutation, useQuery } from '@tanstack/react-query';
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
) {
	return useQuery({
		queryKey: performanceReportKeys.report(kind, academicPeriodId, filters),
		queryFn: () => performanceReportsService.getReport(kind, filters),
		enabled: academicPeriodId != null,
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
	});
}
