import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete, apiGetBlobResponse, ApiError } from '@/shared/lib';
import type { SchoolSourceItem } from '@/shared/types';
import type {
	CreateProjectFullDto,
	FilterProjectDto,
	UpdateProjectDto,
	ProjectByProfessorPaginatedResponse,
	ProjectDetailsResponse,
	ProjectEvaluatorResponse,
	ProjectPaginatedResponse,
	ProjectResponse,
	ProjectStudentResponse,
	RawEvaluationSchool,
} from '../types';

export const projectsService = {
	createFull(body: CreateProjectFullDto): Promise<ApiResponse<ProjectResponse>> {
		return apiPost('/projects/create-full', body);
	},

	getByProfessor(
		professorId: string | number,
		params?: {
			competencyScopeCode?: string;
			page?: number;
			pageSize?: number;
			search?: string;
		},
	): Promise<ApiResponse<ProjectByProfessorPaginatedResponse>> {
		const qs = new URLSearchParams();
		if (params?.competencyScopeCode != null)
			qs.set('competencyScopeCode', params.competencyScopeCode);
		if (params?.page != null) qs.set('page', String(params.page));
		if (params?.pageSize != null) qs.set('pageSize', String(params.pageSize));
		if (params?.search) qs.set('search', params.search);
		const query = qs.toString();
		return apiGet(`/projects/professor/${professorId}${query ? `?${query}` : ''}`);
	},

	getDetails(
		projectId: string | number,
		params?: {
			competencyScopeCode?: string;
			rubricTypeCode?: string;
			isEvaluationMode?: boolean;
		},
	): Promise<ApiResponse<ProjectDetailsResponse>> {
		const qs = new URLSearchParams();
		if (params?.isEvaluationMode) qs.set('isEvaluationMode', String(params.isEvaluationMode));
		if (params?.competencyScopeCode != null)
			qs.set('competencyScopeCode', params.competencyScopeCode);
		if (params?.rubricTypeCode != null) qs.set('rubricTypeCode', params.rubricTypeCode);
		return apiGet(`/projects/project/${projectId}?${qs.toString()}`);
	},

	update(id: string | number, body: UpdateProjectDto): Promise<ApiResponse<ProjectResponse>> {
		return apiPatch(`/projects/update/${id}`, body);
	},

	delete(id: string | number): Promise<ApiResponse<void>> {
		return apiDelete(`/projects/delete/${id}`);
	},

	getByFilters(filters: FilterProjectDto = {}): Promise<ApiResponse<ProjectPaginatedResponse>> {
		return apiPost('/projects/get-by-filters', filters);
	},

	createStudent(body: {
		projectId: number;
		studentSectionEnrollmentId: number;
		isActive: true;
	}): Promise<ApiResponse<ProjectStudentResponse>> {
		return apiPost('/project-students/create', body);
	},

	removeStudent(projectStudentId: number): Promise<ApiResponse<void>> {
		return apiDelete(`/project-students/delete/${projectStudentId}`);
	},

	removeEvaluator(projectEvaluatorId: number): Promise<ApiResponse<void>> {
		return apiDelete(`/project-evaluators/delete/${projectEvaluatorId}`);
	},

	createEvaluator(body: {
		projectId: number;
		professorId: number;
		evaluatorTypeId: number;
		isActive: true;
	}): Promise<ApiResponse<ProjectEvaluatorResponse>> {
		return apiPost('/project-evaluators/create', body);
	},

	exportGrades(params: { competencyScopeCode: string }): Promise<Blob> {
		const qs = new URLSearchParams({ competencyScopeCode: params.competencyScopeCode });
		return apiGetBlobResponse(`/projects/export/grades?${qs.toString()}`).then((r) => r.blob);
	},

	async getSchoolsByProfessor(professorId: string | number): Promise<SchoolSourceItem[]> {
		const envelope = await apiGet<ApiResponse<RawEvaluationSchool[]>>(
			`/projects/professor/${professorId}/schools`,
		);
		if (!envelope?.data) throw new ApiError(envelope?.message ?? 'projects.error.generic');
		return envelope.data.map((school) => ({
			id: Number(school.id),
			code: school.code,
			name: school.name,
		}));
	},
};
