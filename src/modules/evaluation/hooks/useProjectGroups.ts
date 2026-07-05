import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectGroupsService } from '../services';
import type { CreateProjectGroupDto, FilterProjectGroupDto, UpdateProjectGroupDto } from '../types';

export const projectGroupsQueryKeys = {
	all: ['project-groups'] as const,
	list: (filters: FilterProjectGroupDto) => ['project-groups', 'list', filters] as const,
	detail: (id: string | number) => ['project-groups', 'detail', id] as const,
};

export function useProjectGroups(
	filters: FilterProjectGroupDto = {},
	options?: { enabled?: boolean },
) {
	return useQuery({
		queryKey: projectGroupsQueryKeys.list(filters),
		queryFn: () => projectGroupsService.getByFilters(filters).then((r) => r.data),
		enabled: options?.enabled !== false,
		placeholderData: (prev) => prev,
	});
}

/** Selector para el formulario de proyecto: grupos válidos para (periodo, carrera). */
export function useProjectGroupOptions(academicPeriodId?: number, programId?: number) {
	return useQuery({
		queryKey: projectGroupsQueryKeys.list({ academicPeriodId, programId, isActive: true }),
		queryFn: () =>
			projectGroupsService
				.getByFilters({ academicPeriodId, programId, isActive: true })
				.then((r) => r.data),
		enabled: !!academicPeriodId && !!programId,
	});
}

export function useCreateProjectGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateProjectGroupDto) =>
			projectGroupsService.create(dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectGroupsQueryKeys.all });
		},
	});
}

export function useUpdateProjectGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, dto }: { id: number; dto: UpdateProjectGroupDto }) =>
			projectGroupsService.update(id, dto).then((r) => r.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectGroupsQueryKeys.all });
		},
	});
}

export function useDeleteProjectGroup() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => projectGroupsService.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: projectGroupsQueryKeys.all });
		},
	});
}
