import { ApiResponse } from '@/shared';
import { FilterProgramRequest } from '../api/dtos/request';
import { ProgramResponse } from '../api/dtos/response';
import { apiPost } from '@/shared/lib';

export const programsService = {
	getByFilters(filters: FilterProgramRequest = {}): Promise<ApiResponse<ProgramResponse[]>> {
		return apiPost('/programs/get-by-filters', filters);
	},
};
