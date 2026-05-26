import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import type { TypeGroupResponse } from '../api/dtos/response';

export const typeGroupsService = {
	getByFilters(filters: { code?: string }): Promise<ApiResponse<TypeGroupResponse[]>> {
		return apiPost('/type-groups/get-by-filters', filters);
	},
};
