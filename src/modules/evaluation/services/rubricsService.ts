import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateRubricFullDto,
	GetAllRubricsParams,
	UpdateRubricDto,
	GetRubricByIdResponse,
	RubricResponse,
	RubricTypeResolution,
} from '../types';

export const rubricsService = {
	getAll(params?: GetAllRubricsParams): Promise<ApiResponse<RubricResponse[]>> {
		const qs = new URLSearchParams();
		if (params?.programId) qs.set('programId', String(params.programId));
		if (params?.courseId) qs.set('courseId', String(params.courseId));
		const query = qs.toString();
		return apiGet(`/rubrics/get-all${query ? `?${query}` : ''}`);
	},

	resolveType(studyPlanCourseId: number): Promise<ApiResponse<RubricTypeResolution>> {
		const qs = new URLSearchParams({ studyPlanCourseId: String(studyPlanCourseId) });
		return apiGet(`/rubrics/resolve-type?${qs.toString()}`);
	},

	getById(rubricId: string | number): Promise<ApiResponse<GetRubricByIdResponse>> {
		return apiGet(`/rubrics/get-by-id/${rubricId}`);
	},

	createFull(body: CreateRubricFullDto): Promise<ApiResponse<RubricResponse>> {
		return apiPost('/rubrics/create-full', body);
	},

	update(id: string | number, body: UpdateRubricDto): Promise<ApiResponse<RubricResponse>> {
		return apiPatch(`/rubrics/update/${id}`, body);
	},

	delete(id: string | number): Promise<ApiResponse<RubricResponse>> {
		return apiDelete(`/rubrics/delete/${id}`);
	},
};
