import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioProjectsService } from '../services';
import type {
	CreatePortfolioProjectDto,
	FilterPortfolioProjectDto,
	ManagementAssignDto,
	MigrateProjectsDto,
	UpdateManagerPortfolioProjectDto,
	UpdatePortfolioProjectDto,
} from '../types';
import { portfolioQueryKeys } from './queryKeys';

export function usePortfolioProjects(
	filters: FilterPortfolioProjectDto = {},
	page = 1,
	pageSize = 20,
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: portfolioQueryKeys.projectsFiltered(filters, page, pageSize),
		queryFn: () => portfolioProjectsService.getAll(filters, page, pageSize),
		enabled: options?.enabled !== false,
	});
}

export function usePortfolioProject(id: number | string | undefined) {
	return useQuery({
		queryKey: portfolioQueryKeys.projectById(id!),
		queryFn: () => portfolioProjectsService.getById(id!),
		enabled: id != null,
	});
}

export function useCreatePortfolioProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreatePortfolioProjectDto) => portfolioProjectsService.create(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useUpdatePortfolioProject(id: number | string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdatePortfolioProjectDto) => portfolioProjectsService.update(id, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useUpdateManagerPortfolioProject(id: number | string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: UpdateManagerPortfolioProjectDto) =>
			portfolioProjectsService.updateManager(id, dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useDeletePortfolioProject() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number | string) => portfolioProjectsService.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useUnassignPortfolioStudent() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ projectId, studentId }: { projectId: number; studentId: number }) =>
			portfolioProjectsService.unassignStudent(projectId, studentId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useManagementAssignPortfolio() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: ManagementAssignDto) => portfolioProjectsService.managementAssign(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function useMigratePortfolioProjects() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: MigrateProjectsDto) => portfolioProjectsService.migrate(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.projects() });
		},
	});
}

export function usePortfolioApplications(projectId: number | string | undefined) {
	return useQuery({
		queryKey: portfolioQueryKeys.applications(projectId!),
		queryFn: () => portfolioProjectsService.getApplications(projectId!),
		enabled: projectId != null,
	});
}

export function useCreatePortfolioApplication() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			projectId,
			studentId,
		}: {
			projectId: number | string;
			studentId: number | string;
		}) => portfolioProjectsService.createApplication(projectId, studentId),
		onSuccess: (_, { projectId }) => {
			queryClient.invalidateQueries({
				queryKey: portfolioQueryKeys.applications(projectId),
			});
		},
	});
}

export function useDeletePortfolioApplication() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (applicationId: number | string) =>
			portfolioProjectsService.deleteApplication(applicationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: portfolioQueryKeys.s3All });
		},
	});
}

export function usePortfolioTeachersByModality(modalityTypeId: number | undefined) {
	return useQuery({
		queryKey: portfolioQueryKeys.teachersByModality(modalityTypeId!),
		queryFn: () => portfolioProjectsService.getTeachersByModality(modalityTypeId!),
		enabled: modalityTypeId != null,
	});
}
