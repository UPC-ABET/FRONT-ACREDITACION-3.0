import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateRubricDto,
	CreateRubricFullDto,
	FilterRubricDto,
	UpdateRubricDto,
	GetRubricByIdResponse,
	RubricResponse,
} from '../types';

export const rubricsService = {
	getAll(): Promise<ApiResponse<RubricResponse[]>> {
		return apiGet('/rubrics/get-all');
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
