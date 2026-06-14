import type { ApiResponse } from '@/shared';
import { apiGet } from '@/shared/lib';
import type { OutcomeCommissionOption } from '../types';

export const programCommissionsService = {
	// The active period travels as the X-Academic-Period-Id header; the endpoint returns only
	// commissions that have a program-commission for the given program in that period.
	commissionOptions(programId: number): Promise<ApiResponse<OutcomeCommissionOption[]>> {
		return apiGet(`/program-commissions/commission-options?programId=${programId}`);
	},
};
