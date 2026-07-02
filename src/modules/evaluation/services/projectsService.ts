import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete, apiGetBlobResponse } from '@/shared/lib';
import type {
	CreateProjectDto,
	CreateProjectFullDto,
	FilterProjectDto,
	UpdateProjectDto,
	ProjectByProfessorPaginatedResponse,
	ProjectByProfessorResponse,
	ProjectDetailsResponse,
	ProjectEvaluatorResponse,
	ProjectPaginatedResponse,
	ProjectResponse,
	ProjectStudentResponse,
} from '../types';

export const projectsService = {
	create(body: CreateProjectDto): Promise<ApiResponse<ProjectResponse>> {
		return apiPost('/projects/create', body);
	},

	createFull(body: CreateProjectFullDto): Promise<ApiResponse<ProjectResponse>> {
		return apiPost('/projects/create-full', body);
	},

	getByEvaluator(
		evaluatorId: string | number,
		params?: { gradeTypeCode?: string },
	): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
		const qs = new URLSearchParams();
		if (params?.gradeTypeCode != null) qs.set('gradeTypeCode', params.gradeTypeCode);
		const query = qs.toString();
		return apiGet(`/projects/evaluator/${evaluatorId}${query ? `?${query}` : ''}`);
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

	getById(projectId: string | number): Promise<ApiResponse<ProjectResponse>> {
		return apiGet(`/projects/project/${projectId}`);
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

	getAll(): Promise<ApiResponse<ProjectResponse[]>> {
		return apiGet('/projects/get-all');
	},

	getByFilters(filters: FilterProjectDto = {}): Promise<ApiResponse<ProjectPaginatedResponse>> {
		return apiPost('/projects/get-by-filters', filters);
	},

	addStudents(
		projectId: string | number,
		studentSectionEnrollmentIds: number[],
	): Promise<ApiResponse<ProjectResponse>> {
		return apiPost(`/projects/project/${projectId}/students`, {
			studentSectionEnrollmentIds: studentSectionEnrollmentIds,
		});
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

	addEvaluators(
		projectId: string | number,
		professorIds: number[],
	): Promise<ApiResponse<ProjectResponse>> {
		return apiPost(`/projects/project/${projectId}/evaluators`, {
			evaluatorProfessorIds: professorIds,
		});
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

	exportGrades(params: { gradeTypeCode: string }): Promise<Blob> {
		const qs = new URLSearchParams({ gradeTypeCode: params.gradeTypeCode });
		return apiGetBlobResponse(`/projects/export/grades?${qs.toString()}`).then((r) => r.blob);
	},
};
