import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import type { TypeItemResponse } from '@/modules/core';

export const typesService = {
	getByFilters(filters: { type_group_id?: number }): Promise<ApiResponse<TypeItemResponse[]>> {
		return apiPost('/types/get-by-filters', filters);
	},
};
