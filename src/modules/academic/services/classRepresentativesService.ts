import { ApiResponse } from '@/shared';
import { apiGet, apiPut } from '@/shared/lib';
import type { AssignRepresentativeDto, ClassRepresentativeMaintenanceList } from '../types';

const REPRESENTATIVES_BASE = '/admin/academic/class-representatives';

export const classRepresentativesService = {
	assign(body: AssignRepresentativeDto): Promise<ApiResponse<{ success: boolean }>> {
		return apiPut(`${REPRESENTATIVES_BASE}/assign`, body);
	},

	remove(body: AssignRepresentativeDto): Promise<ApiResponse<{ success: boolean }>> {
		return apiPut(`${REPRESENTATIVES_BASE}/remove`, body);
	},

	maintenance(params: {
		page: number;
		pageSize: number;
		search?: string;
	}): Promise<ApiResponse<ClassRepresentativeMaintenanceList>> {
		const query = new URLSearchParams();
		query.set('page', String(params.page));
		query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		return apiGet(`${REPRESENTATIVES_BASE}/maintenance?${query.toString()}`);
	},
};
