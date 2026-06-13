import { useQuery } from '@tanstack/react-query';
import { findUploadLog, listUploadLogs } from '../services';
import { LOADS_QUERY_KEYS } from '../constants';
import type { UploadLog, UploadLogFilters, UploadLogPage } from '../types';

export function useUploadHistory(
	filters: UploadLogFilters = {},
	academicPeriodId: number | null = null,
) {
	return useQuery<UploadLogPage, Error>({
		// The selected period travels as the X-Academic-Period-Id header (injected
		// globally), so it stays out of `filters`; it is keyed here only so a period
		// switch re-fetches. Without a period the request is disabled entirely.
		queryKey: LOADS_QUERY_KEYS.uploadHistoryList({ ...filters, academicPeriodId } as Record<
			string,
			unknown
		>),
		queryFn: () => listUploadLogs(filters),
		placeholderData: (previousData) => previousData,
		enabled: academicPeriodId != null,
	});
}

export function useUploadLog(id: number | null) {
	return useQuery<UploadLog, Error>({
		queryKey: id
			? LOADS_QUERY_KEYS.uploadHistoryDetail(id)
			: ['loads', 'upload-history', 'detail', 'noop'],
		queryFn: () => findUploadLog(id as number),
		enabled: id !== null,
	});
}
