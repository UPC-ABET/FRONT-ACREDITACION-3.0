import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateRubricDto,
	CreateRubricFullDto,
	FilterRubricDto,
	GetAllRubricsParams,
	RubricPaginatedResponse,
	UpdateRubricDto,
	GetRubricByIdResponse,
	RubricResponse,
	RubricTypeResolution,
} from '../types';

export const rubricsService = {
	getAll(params?: GetAllRubricsParams): Promise<ApiResponse<RubricPaginatedResponse>> {
		const qs = new URLSearchParams();
		if (params?.programId) qs.set('programId', String(params.programId));
		if (params?.courseId) qs.set('courseId', String(params.courseId));
		if (params?.page) qs.set('page', String(params.page));
		if (params?.pageSize) qs.set('pageSize', String(params.pageSize));
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
