import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateRubricDto,
	CreateRubricFullDto,
	FilterRubricDto,
	GetAllRubricsParams,
	UpdateRubricDto,
	GetRubricByIdResponse,
	RubricResponse,
} from '../types';

export const rubricsService = {
	getAll(params?: GetAllRubricsParams): Promise<ApiResponse<RubricResponse[]>> {
		const qs = new URLSearchParams();
		if (params?.schoolId) qs.set('schoolId', String(params.schoolId));
		if (params?.academicPeriodId) qs.set('academicPeriodId', String(params.academicPeriodId));
		if (params?.programId) qs.set('programId', String(params.programId));
		if (params?.courseId) qs.set('courseId', String(params.courseId));
		const query = qs.toString();
		return apiGet(`/rubrics/get-all${query ? `?${query}` : ''}`);
	},

	getById(rubricId: string | number): Promise<ApiResponse<GetRubricByIdResponse>> {
		return apiGet(`/rubrics/get-by-id/${rubricId}`);
	},

	create(body: CreateRubricDto): Promise<ApiResponse<RubricResponse>> {
		return apiPost('/rubrics/create', body);
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

	getByFilters(filters: FilterRubricDto): Promise<ApiResponse<RubricResponse[]>> {
		return apiPost('/rubrics/get-by-filters', filters);
	},
};
