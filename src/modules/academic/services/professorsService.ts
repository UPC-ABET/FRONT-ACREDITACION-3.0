import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import {
	ProfessorResponse,
	ProfessorSearchResponse,
	ProfessorMaintenanceCreate,
	ProfessorMaintenanceItem,
	ProfessorMaintenanceList,
	ProfessorMaintenanceUpdate,
} from '../types';

export const professorsService = {
	getByUserId(userId: string | number): Promise<ApiResponse<ProfessorResponse>> {
		return apiGet(`/professors/get-by-user-id/${userId}`);
	},

	getByFilters(filters: {
		search?: string;
		isActive?: boolean;
		unassigned?: boolean;
	}): Promise<ApiResponse<ProfessorSearchResponse[]>> {
		return apiPost('/professors/get-by-filters', { isActive: true, ...filters });
	},

	maintenanceList(params: {
		page?: number;
		pageSize?: number;
		search?: string;
	}): Promise<ApiResponse<ProfessorMaintenanceList>> {
		const query = new URLSearchParams();
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		const qs = query.toString();
		return apiGet(`/professors/maintenance${qs ? `?${qs}` : ''}`);
	},

	maintenanceCreate(
		body: ProfessorMaintenanceCreate,
	): Promise<ApiResponse<ProfessorMaintenanceItem>> {
		return apiPost('/professors/maintenance', body);
	},

	maintenanceUpdate(
		id: number,
		body: ProfessorMaintenanceUpdate,
	): Promise<ApiResponse<ProfessorMaintenanceItem>> {
		return apiPut(`/professors/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/professors/maintenance/${id}`);
	},
};
