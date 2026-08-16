import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { triggerBrowserDownload } from '@/shared/utils/triggerBrowserDownload';
import { projectsService } from '../services';
import type { CreateProjectFullDto, FilterProjectDto } from '../types';

type ByProfessorParams = {
	competencyScopeCode?: string;
	page?: number;
	pageSize?: number;
	search?: string;
};

type DetailsParams = {
	competencyScopeCode?: string;
	rubricTypeCode?: string;
	isEvaluationMode?: boolean;
};

export const projectsQueryKeys = {
	all: ['projects'] as const,
	filtered: (filters: FilterProjectDto) => ['projects', 'filtered', filters] as const,
	byProfessor: (professorId: string | number, params?: ByProfessorParams) =>
		['projects', 'by-professor', professorId, params ?? {}] as const,
	details: (projectId: string | number, params?: DetailsParams) =>
		['projects', 'details', projectId, params ?? {}] as const,
	/** Prefix that matches a project's details under any params — use it to invalidate, since
	 * `details(projectId)` builds a `{}` params segment that only matches by coincidence. */
	detailsAll: (projectId: string | number) => ['projects', 'details', projectId] as const,
};

export function useProjects(filters: FilterProjectDto = {}, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: projectsQueryKeys.filtered(filters),
		queryFn: () => projectsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled !== false,
		placeholderData: (prev) => prev,
	});
}

export function useProjectsByProfessor(
	professorId: string | number | undefined,
	params?: ByProfessorParams,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: projectsQueryKeys.byProfessor(professorId!, params),
		queryFn: () => projectsService.getByProfessor(professorId!, params).then((r) => r.data),
		enabled: professorId != null && options?.enabled !== false,
		placeholderData: (prev) => prev,
	});
}

export function useProjectDetails(projectId: string | number | undefined, params?: DetailsParams) {
	return useQuery({
		queryKey: projectsQueryKeys.details(projectId!, params),
		queryFn: () => projectsService.getDetails(projectId!, params).then((r) => r.data),
		enabled: projectId != null,
	});
}

export function useCreateProjectFull() {
	return useMutation({
		mutationFn: (body: CreateProjectFullDto) =>
			projectsService.createFull(body).then((r) => r.data),
	});
}

export function useAddProjectStudents(projectId: string, projectNumericId: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (students: { studentSectionEnrollmentId: number }[]) =>
			Promise.all(
				students.map((student) =>
					projectsService.createStudent({
						projectId: projectNumericId,
						studentSectionEnrollmentId: student.studentSectionEnrollmentId,
						isActive: true,
					}),
				),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: projectsQueryKeys.details(projectId, { isEvaluationMode: false }),
			});
		},
	});
}

export function useCreateProjectEvaluator(projectId: string, projectNumericId: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: { professorId: number; evaluatorTypeId: number }) =>
			projectsService.createEvaluator({
				projectId: projectNumericId,
				professorId: body.professorId,
				evaluatorTypeId: body.evaluatorTypeId,
				isActive: true,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: projectsQueryKeys.details(projectId, { isEvaluationMode: false }),
			});
		},
	});
}

export function useUpdateProject(projectId: string | number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: Parameters<typeof projectsService.update>[1]) =>
			projectsService.update(projectId, body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
		},
	});
}

export function useRemoveProjectStudent(projectId: string | number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (projectStudentId: number) => projectsService.removeStudent(projectStudentId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detailsAll(projectId) });
		},
	});
}

export function useDeleteProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string | number) => projectsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.all });
		},
	});
}

export function useExportProjectGrades() {
	return useMutation({
		mutationFn: (params: { competencyScopeCode: string; filename: string }) =>
			projectsService.exportGrades(params).then((blob) => {
				triggerBrowserDownload(blob, params.filename);
			}),
	});
}

export function useRemoveProjectEvaluator(projectId: string | number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (projectEvaluatorId: number) => projectsService.removeEvaluator(projectEvaluatorId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.detailsAll(projectId) });
		},
	});
}
