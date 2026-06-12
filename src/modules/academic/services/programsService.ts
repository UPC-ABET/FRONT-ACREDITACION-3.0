import { ApiResponse } from '@/shared';
import { FilterProgramRequest, ProgramResponse } from '../types';
import { apiGet, apiPost } from '@/shared/lib';

export const programsService = {
	getByFilters(filters: FilterProgramRequest = {}): Promise<ApiResponse<ProgramResponse[]>> {
		return apiPost('/programs/get-by-filters', filters);
	},

	getAll(): Promise<ApiResponse<ProgramResponse[]>> {
		return apiGet('/programs/get-all');
	},
};
