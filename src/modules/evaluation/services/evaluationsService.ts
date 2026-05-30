import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib';
import type { FinalizeEvaluationDto, SubmitEvaluationPayload } from '../types';
import type { EvaluationResponse } from '../types';

interface CreateEvaluationPayload {
	projectStudentId: number;
	projectEvaluatorId: number;
	rubricId?: number;
	observation?: { es: string; en: string };
	scores?: Array<{ rubricQuestionCriteriaId: number; score: number }>;
	qualificationStatusTypeId?: number | null;
}

interface UpdateEvaluationPayload {
	observation?: { es: string; en: string };
	scores?: Array<{ rubricQuestionCriteriaId: number; score: number }>;
	qualificationStatusTypeId?: number | null;
}

interface EvaluationFilters {
	projectStudentId?: number;
	projectEvaluatorId?: number;
	rubricId?: number;
	qualificationStatusTypeId?: number;
	isActive?: boolean;
}

export const evaluationsService = {
	submit(body: SubmitEvaluationPayload): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/submit', body);
	},

	saveObservation(body: {
		evaluationId: number;
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

	create(body: CreateEvaluationPayload): Promise<ApiResponse<EvaluationResponse>> {
		return apiPost('/evaluations/create', body);
	},

	update(
		id: string | number,
		body: UpdateEvaluationPayload,
	): Promise<ApiResponse<EvaluationResponse>> {
		return apiPut(`/evaluations/update/${id}`, body);
	},

	delete(id: string | number): Promise<ApiResponse<EvaluationResponse>> {
		return apiDelete(`/evaluations/delete/${id}`);
	},

	getAll(): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiGet('/evaluations/get-all');
	},

	getByFilters(filters: EvaluationFilters): Promise<ApiResponse<EvaluationResponse[]>> {
		return apiPost('/evaluations/get-by-filters', filters);
	},
};
