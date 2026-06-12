import { ApiResponse } from '@/shared';
import { apiGet, apiPost } from '@/shared/lib';
import { ProfessorResponse, ProfessorSearchResponse } from '../types';

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
};
