import { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import type { SubmitEvaluationPayload, EvaluationResponse } from '../types';

export const evaluationsService = {
	submit(body: SubmitEvaluationPayload): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/submit', body);
	},
};
