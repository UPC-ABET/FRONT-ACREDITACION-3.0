import { useQuery } from '@tanstack/react-query'
import { projectsService } from '../services'
import { FilterProjectDto } from '../api/dtos/request'

export const projectsQueryKeys = {
  all: ['projects'] as const,
  filtered: (filters: FilterProjectDto) => ['projects', 'filtered', filters] as const,
  byProfessor: (professorId: string | number) => ['projects', 'by-professor', professorId] as const,
}

export function useProjects(filters: FilterProjectDto = {}) {
  return useQuery({
    queryKey: projectsQueryKeys.filtered(filters),
    queryFn: () => projectsService.getByFilters(filters).then((r) => r.data),
  })
}

export function useProjectsByProfessor(professorId: string | number | undefined) {
  return useQuery({
    queryKey: projectsQueryKeys.byProfessor(professorId!),
    queryFn: () => projectsService.getByProfessor(professorId!).then((r) => r.data),
    enabled: professorId != null,
  })
}
