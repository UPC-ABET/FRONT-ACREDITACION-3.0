import { useQuery } from '@tanstack/react-query'
import { projectsService } from '../services'
import { FilterProjectDto } from '../api/dtos/request'

export const projectsQueryKeys = {
  all: ['projects'] as const,
  filtered: (filters: FilterProjectDto) => ['projects', 'filtered', filters] as const,
}

export function useProjects(filters: FilterProjectDto = {}) {
  return useQuery({
    queryKey: projectsQueryKeys.filtered(filters),
    queryFn: () => projectsService.getByFilters(filters).then((r) => r.data),
  })
}
