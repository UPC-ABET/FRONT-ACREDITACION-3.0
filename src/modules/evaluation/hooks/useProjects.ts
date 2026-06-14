import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { triggerBrowserDownload } from '@/shared/utils/triggerBrowserDownload';
import { projectsService } from '../services';
import type { FilterProjectDto } from '../types';

type ByProfessorParams = {
	academicPeriodId?: number;
	schoolId?: number;
	gradeTypeCode?: string;
};

type DetailsParams = {
	gradeTypeCode?: string;
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
};

export function useProjects(filters: FilterProjectDto = {}) {
	return useQuery({
		queryKey: projectsQueryKeys.filtered(filters),
		queryFn: () => projectsService.getByFilters(filters).then((r) => r.data),
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
	});
}

export function useProjectDetails(projectId: string | number | undefined, params?: DetailsParams) {
	return useQuery({
		queryKey: projectsQueryKeys.details(projectId!, params),
		queryFn: () => projectsService.getDetails(projectId!, params).then((r) => r.data),
		enabled: projectId != null,
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
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.details(projectId) });
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
		mutationFn: (params: { gradeTypeCode: string; filename: string }) =>
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
			queryClient.invalidateQueries({ queryKey: projectsQueryKeys.details(projectId) });
		},
	});
}
