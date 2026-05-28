import { ApiResponse } from '@/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/shared/lib';
import type {
	CreateProjectDto,
	CreateProjectFullDto,
	FilterProjectDto,
	UpdateProjectDto,
	ProjectByProfessorResponse,
	ProjectDetailsResponse,
	ProjectEvaluatorResponse,
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

	getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
		return apiGet(`/projects/evaluator/${evaluatorId}`);
	},

	getByProfessor(
		professorId: string | number,
		params?: {
			academicPeriodId?: number;
			schoolId?: number;
			gradeTypeId?: number;
		},
	): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
		const qs = new URLSearchParams();
		if (params?.academicPeriodId != null)
			qs.set('academicPeriodId', String(params.academicPeriodId));
		if (params?.schoolId != null) qs.set('schoolId', String(params.schoolId));
		if (params?.gradeTypeId != null) qs.set('gradeTypeId', String(params.gradeTypeId));
		const query = qs.toString();
		return apiGet(`/projects/professor/${professorId}${query ? `?${query}` : ''}`);
	},

	getById(projectId: string | number): Promise<ApiResponse<ProjectResponse>> {
		return apiGet(`/projects/project/${projectId}`);
	},

	getDetails(
		projectId: string | number,
		params?: {
			gradeTypeId?: number;
			rubricTypeId?: number;
			isEvaluationMode?: boolean;
		},
	): Promise<ApiResponse<ProjectDetailsResponse>> {
		const qs = new URLSearchParams();
		if (params?.isEvaluationMode) qs.set('is_evaluation_mode', String(params.isEvaluationMode));
		if (params?.gradeTypeId != null) qs.set('grade_type_id', String(params.gradeTypeId));
		if (params?.rubricTypeId != null) qs.set('rubric_type_id', String(params.rubricTypeId));
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

	getByFilters(filters: FilterProjectDto = {}): Promise<ApiResponse<ProjectResponse[]>> {
		return apiPost('/projects/get-by-filters', filters);
	},

	addStudents(
		projectId: string | number,
		studentSectionEnrollmentIds: number[],
	): Promise<ApiResponse<ProjectResponse>> {
		return apiPost(`/projects/project/${projectId}/students`, {
			student_section_enrollment_ids: studentSectionEnrollmentIds,
		});
	},

	createStudent(body: {
		project_id: number;
		student_section_enrollment_id: number;
		is_active: true;
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
			evaluator_professor_ids: professorIds,
		});
	},

	removeEvaluator(projectEvaluatorId: number): Promise<ApiResponse<void>> {
		return apiDelete(`/project-evaluators/delete/${projectEvaluatorId}`);
	},

	createEvaluator(body: {
		project_id: number;
		professor_id: number;
		evaluator_type_id: number;
		is_active: true;
	}): Promise<ApiResponse<ProjectEvaluatorResponse>> {
		return apiPost('/project-evaluators/create', body);
	},
};
