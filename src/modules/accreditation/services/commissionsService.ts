import type { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import type { CommissionResponse, FilterCommissionRequest } from '../types';

export const commissionsService = {
	getByFilters(filters: FilterCommissionRequest = {}): Promise<ApiResponse<CommissionResponse[]>> {
		return apiPost('/commissions/get-by-filters', filters);
	},
};
