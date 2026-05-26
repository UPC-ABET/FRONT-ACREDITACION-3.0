import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib';
import type { FinalizeEvaluationDto, SubmitEvaluationPayload } from '../api/dtos/request';
import { EvaluationResponse } from '../api/dtos/response';

export const evaluationsService = {
	submit(body: SubmitEvaluationPayload): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/submit', body);
	},

	saveObservation(body: {
		evaluation_id: number;
		observation: { es: string; en: string };
	}): Promise<ApiResponse<EvaluationResponse>> {
		return apiPut('/evaluations/observation', body);
	},

	finalize(body: FinalizeEvaluationDto): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/finalize', body);
	},

	getByStudent(studentId: string | number): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiGet(`/evaluations/student/${studentId}`);
	},

	getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiGet(`/evaluations/evaluator/${evaluatorId}`);
	},

	getById(evaluationId: string | number): Promise<ApiResponse<EvaluationResponse>> {
		return apiGet(`/evaluations/evaluation/${evaluationId}`);
	},

	create(body: Record<string, unknown>): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/create', body);
	},

	update(id: string | number, body: Record<string, unknown>): Promise<ApiResponse<EvaluationResponse>> {
		return apiPut(`/evaluations/update/${id}`, body);
	},

	delete(id: string | number): Promise<ApiResponse<EvaluationResponse>> {
		return apiDelete(`/evaluations/delete/${id}`);
	},

	getAll(): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiGet('/evaluations/get-all');
	},

	getByFilters(filters: Record<string, unknown>): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiPost('/evaluations/get-by-filters', filters);
	},
};
