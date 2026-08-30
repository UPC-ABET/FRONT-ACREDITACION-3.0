import { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import type {
	OutcomeMaintenanceCreate,
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
		// Omitting this when the program has more than one active commission in the period mixes
		// every commission's outcomes together -- always send it when it's known.
		commissionId?: number;
		page?: number;
		pageSize?: number;
		search?: string;
	}): Promise<ApiResponse<OutcomeMaintenanceList>> {
		const query = new URLSearchParams();
		query.set('programId', String(params.programId));
		if (params.commissionId != null) query.set('commissionId', String(params.commissionId));
		if (params.page != null) query.set('page', String(params.page));
		if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
		if (params.search) query.set('search', params.search);
		return apiGet(`/outcomes/maintenance?${query.toString()}`);
	},

	// Period travels as the X-Academic-Period-Id header; the server resolves the
	// programCommission from programId + commissionId + active period.
	maintenanceCreate(body: OutcomeMaintenanceCreate): Promise<ApiResponse<OutcomeMaintenanceItem>> {
		return apiPost('/outcomes/maintenance', body);
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
