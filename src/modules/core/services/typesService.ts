import { ApiResponse } from '@/shared';
import { apiGet, apiPost } from '@/shared/lib';
import type { TypeItemResponse } from '../api/dtos/response';

export const typesService = {
	getByFilters(filters: { type_group_id?: number }): Promise<ApiResponse<TypeItemResponse[]>> {
		return apiPost('/types/get-by-filters', filters);
	},

	getByGroupCode(groupCode: string): Promise<ApiResponse<TypeItemResponse[]>> {
		return apiGet(`/types/by-group-code/${groupCode}`);
	},
};
