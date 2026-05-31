import { useQuery } from '@tanstack/react-query';
import { findUploadLog, listUploadLogs } from '../services';
import { LOADS_QUERY_KEYS } from '../constants';
import type { UploadLog, UploadLogFilters } from '../types';

export function useUploadHistory(filters: UploadLogFilters = {}) {
	return useQuery<UploadLog[], Error>({
		queryKey: LOADS_QUERY_KEYS.uploadHistoryList(filters as Record<string, unknown>),
		queryFn: () => listUploadLogs(filters),
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
