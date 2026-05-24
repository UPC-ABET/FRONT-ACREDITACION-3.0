import { ApiResponse } from '@/shared';
import { apiGet, apiPost } from '@/shared/lib';
import { ProfessorResponse, ProfessorSearchResponse } from '../api/dtos/response';

export const professorsService = {
	getByUserId(userId: string | number): Promise<ApiResponse<ProfessorResponse>> {
		return apiGet(`/professors/get-by-user-id/${userId}`);
	},

	getByFilters(filters: {
		search?: string;
		is_active?: boolean;
	}): Promise<ApiResponse<ProfessorSearchResponse[]>> {
		return apiPost('/professors/get-by-filters', { is_active: true, ...filters });
	},
};
