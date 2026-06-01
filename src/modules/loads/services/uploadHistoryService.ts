import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { UploadLog, UploadLogFilters } from '../types';

const BASE = '/uploads/upload-logs';

export async function listUploadLogs(filters: UploadLogFilters = {}): Promise<UploadLog[]> {
	const params = new URLSearchParams();
	if (filters.uploadType) params.set('uploadType', filters.uploadType);
	if (filters.status) params.set('status', filters.status);
	if (filters.academicPeriodId !== undefined) {
		params.set('academicPeriodId', String(filters.academicPeriodId));
	}
	if (filters.limit !== undefined) params.set('limit', String(filters.limit));
	if (filters.offset !== undefined) params.set('offset', String(filters.offset));
	const qs = params.toString();
	return getApiData<UploadLog[]>(await apiGet(`${BASE}${qs ? `?${qs}` : ''}`));
}

export async function findUploadLog(id: number): Promise<UploadLog> {
	return getApiData<UploadLog>(await apiGet(`${BASE}/${id}`));
}
