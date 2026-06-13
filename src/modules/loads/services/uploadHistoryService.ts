import { apiGet, getApiData } from '@/shared/lib/apiClient';
import type { UploadLog, UploadLogFilters, UploadLogPage } from '../types';

const BASE = '/uploads/upload-logs';

export async function listUploadLogs(filters: UploadLogFilters = {}): Promise<UploadLogPage> {
	const params = new URLSearchParams();
	if (filters.uploadTypeCode) params.set('uploadTypeCode', filters.uploadTypeCode);
	if (filters.statusCode) params.set('statusCode', filters.statusCode);
	if (filters.academicPeriodId !== undefined) {
		params.set('academicPeriodId', String(filters.academicPeriodId));
	}
	if (filters.page !== undefined) params.set('page', String(filters.page));
	if (filters.pageSize !== undefined) params.set('pageSize', String(filters.pageSize));
	const qs = params.toString();
	return getApiData<UploadLogPage>(await apiGet(`${BASE}${qs ? `?${qs}` : ''}`));
}

export async function findUploadLog(id: number): Promise<UploadLog> {
	return getApiData<UploadLog>(await apiGet(`${BASE}/${id}`));
}
