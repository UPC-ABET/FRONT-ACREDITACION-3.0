import { useMutation, useQuery } from '@tanstack/react-query';
import { triggerBlobDownload } from '@/shared/lib/fileDownload';
import { semaphoreReportsService } from '../services/semaphoreReportsService';
import type { SemaphoreFilterDto, SemaphoreReportFormat, SemaphoreReportKind } from '../types';

export const semaphoreReportKeys = {
	all: ['evaluation', 'semaphore-reports'] as const,
	// The active period travels in the X-Academic-Period-Id header, so it must be part of the
	// key — otherwise React Query would serve a cached report from a different period.
	report: (
		kind: SemaphoreReportKind,
		academicPeriodId: number | null,
		filters: SemaphoreFilterDto,
	) => [...semaphoreReportKeys.all, kind, academicPeriodId, filters] as const,
};

export function useSemaphoreReport(
	kind: SemaphoreReportKind,
	filters: SemaphoreFilterDto,
	academicPeriodId: number | null,
) {
	return useQuery({
		queryKey: semaphoreReportKeys.report(kind, academicPeriodId, filters),
		queryFn: () => semaphoreReportsService.getReport(kind, filters),
		enabled: academicPeriodId != null,
		retry: false,
	});
}

export function useSemaphoreReportDownload(kind: SemaphoreReportKind) {
	return useMutation({
		mutationFn: ({
			format,
			filters,
		}: {
			format: SemaphoreReportFormat;
			filters: SemaphoreFilterDto;
		}) => semaphoreReportsService.downloadReport(kind, format, filters),
		onSuccess: ({ blob, filename }) => triggerBlobDownload(blob, filename),
	});
}
