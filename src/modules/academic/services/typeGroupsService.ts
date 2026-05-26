import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import { TypeGroupResponse } from '../types';

export const typeGroupsService = {
	getByFilters(filters: { code?: string }): Promise<ApiResponse<TypeGroupResponse[]>> {
		return apiPost('/type-groups/get-by-filters', filters);
	},
};
