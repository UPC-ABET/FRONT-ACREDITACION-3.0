import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPut } from '@/shared/lib';
import type {
	OutcomeMaintenanceItem,
	OutcomeMaintenanceList,
	OutcomeMaintenanceUpdate,
	OutcomeResponse,
} from '../types';

export const outcomesService = {
	getById(outcomeId: number): Promise<ApiResponse<OutcomeResponse>> {
		return apiGet(`/outcomes/get-by-id/${outcomeId}`);
	},

	maintenanceList(params: {
		programId: number;
		academicPeriodId: number;
		page?: number;
		pageSize?: number;
		search?: string;
	}): Promise<ApiResponse<OutcomeMaintenanceList>> {
		const query = new URLSearchParams();
		query.set('programId', String(params.programId));
		query.set('academicPeriodId', String(params.academicPeriodId));
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		return apiGet(`/outcomes/maintenance?${query.toString()}`);
	},

	maintenanceUpdate(
		id: number,
		body: OutcomeMaintenanceUpdate,
	): Promise<ApiResponse<OutcomeMaintenanceItem>> {
		return apiPut(`/outcomes/maintenance/${id}`, body);
	},

	maintenanceDelete(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`/outcomes/maintenance/${id}`);
	},
};
