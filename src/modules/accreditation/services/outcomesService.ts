import { ApiResponse } from '@/shared';
import { apiGet } from '@/shared/lib';
import type { OutcomeResponse } from '../types';

export const outcomesService = {
	getById(outcomeId: number): Promise<ApiResponse<OutcomeResponse>> {
		return apiGet(`/outcomes/get-by-id/${outcomeId}`);
	},
};
