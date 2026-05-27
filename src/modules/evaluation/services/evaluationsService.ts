import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib';
import type { FinalizeEvaluationDto } from '../types';
import type { SubmitEvaluationPayload } from '../api/dtos/request';
import type { EvaluationResponse } from '../types';

interface CreateEvaluationPayload {
	project_student_id: number;
	project_evaluator_id: number;
	rubric_id?: number;
	observation?: { es: string; en: string };
	scores?: Array<{ rubric_question_criteria_id: number; score: number }>;
	qualification_status_type_id?: number | null;
}

interface UpdateEvaluationPayload {
	observation?: { es: string; en: string };
	scores?: Array<{ rubric_question_criteria_id: number; score: number }>;
	qualification_status_type_id?: number | null;
}

interface EvaluationFilters {
	project_student_id?: number;
	project_evaluator_id?: number;
	rubric_id?: number;
	qualification_status_type_id?: number;
	is_active?: boolean;
}

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
