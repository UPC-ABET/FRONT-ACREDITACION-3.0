import { ApiResponse } from '@/shared';
import { apiGet } from '@/shared/lib';
import type { CampusResponse } from '../types';

export const campusesService = {
	getAll(): Promise<ApiResponse<CampusResponse[]>> {
		return apiGet('/campuses/get-all');
	},
};
