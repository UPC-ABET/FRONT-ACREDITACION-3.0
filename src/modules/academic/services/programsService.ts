import { ApiResponse } from '@/shared';
import { FilterProgramRequest, ProgramResponse } from './types';
import { apiPost } from '@/shared/lib';

export const programsService = {
	getByFilters(filters: FilterProgramRequest = {}): Promise<ApiResponse<ProgramResponse[]>> {
		return apiPost('/programs/get-by-filters', filters);
	},
};
