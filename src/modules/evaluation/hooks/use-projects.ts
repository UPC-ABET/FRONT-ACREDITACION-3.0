import { useQuery } from '@tanstack/react-query'
import { projectsService } from '../services'
import { FilterProjectDto } from '../api/dtos/request'

type ByProfessorParams = {
  academicPeriodId?: number
  schoolId?: number
  gradeTypeId?: number
}

type DetailsParams = {
  gradeTypeId?: number
  rubricTypeId?: number
}

export const projectsQueryKeys = {
  all: ['projects'] as const,
  filtered: (filters: FilterProjectDto) => ['projects', 'filtered', filters] as const,
  byProfessor: (professorId: string | number, params?: ByProfessorParams) =>
    ['projects', 'by-professor', professorId, params ?? {}] as const,
  details: (projectId: string | number, params?: DetailsParams) =>
    ['projects', 'details', projectId, params ?? {}] as const,
}

export function useProjects(filters: FilterProjectDto = {}) {
  return useQuery({
    queryKey: projectsQueryKeys.filtered(filters),
    queryFn: () => projectsService.getByFilters(filters).then((r) => r.data),
  })
}

export function useProjectsByProfessor(
  professorId: string | number | undefined,
  params?: ByProfessorParams,
) {
  return useQuery({
    queryKey: projectsQueryKeys.byProfessor(professorId!, params),
    queryFn: () => projectsService.getByProfessor(professorId!, params).then((r) => r.data),
    enabled: professorId != null,
  })
}

export function useProjectDetails(
  projectId: string | number | undefined,
  params?: DetailsParams,
) {
  return useQuery({
    queryKey: projectsQueryKeys.details(projectId!, params),
    queryFn: () => projectsService.getDetails(projectId!, params).then((r) => r.data),
    enabled: projectId != null,
  })
}
