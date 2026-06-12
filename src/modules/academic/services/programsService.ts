import { ApiResponse } from '@/shared';
import { FilterProgramRequest, ProgramResponse } from '../types';
import { apiGet, apiPost } from '@/shared/lib';

export const programsService = {
	getByFilters(filters: FilterProgramRequest = {}): Promise<ApiResponse<ProgramResponse[]>> {
		return apiPost('/programs/get-by-filters', filters);
	},

	// Programs of the active modality. Modality travels as the X-Modality-Type-Id
	// header (injected globally), not a query param.
	byModality(): Promise<ApiResponse<ProgramResponse[]>> {
		return apiGet('/programs/by-modality');
	},
};
