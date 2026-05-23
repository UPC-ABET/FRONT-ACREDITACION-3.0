import { ApiResponse } from "@/shared";
import { buildJsonHeaders } from '@/shared/lib'
import { FilterProjectDto } from '../api/dtos/request'
import { ProjectByProfessorResponse, ProjectDetailsResponse, ProjectResponse } from '../api/dtos/response'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: buildJsonHeaders(options?.headers),
    ...options,
  })
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`)
  return (res.json() as unknown) as T
}

export const projectsService = {
  create(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/create`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  createFull(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/create-full`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/projects/evaluator/${evaluatorId}`)
  },

  getByProfessor(
    professorId: string | number,
    params?: {
      academicPeriodId?: number
      schoolId?: number
      gradeTypeId?: number
    },
  ): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
    const qs = new URLSearchParams()
    if (params?.academicPeriodId != null) qs.set('academicPeriodId', String(params.academicPeriodId))
    if (params?.schoolId != null) qs.set('schoolId', String(params.schoolId))
    if (params?.gradeTypeId != null) qs.set('gradeTypeId', String(params.gradeTypeId))
    const query = qs.toString()
    return request(`${BASE_URL}/projects/professor/${professorId}${query ? `?${query}` : ''}`)
  },

  getById(projectId: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/project/${projectId}`)
  },

  getDetails(
    projectId: string | number,
    params?: {
      gradeTypeId?: number
      rubricTypeId?: number
    },
  ): Promise<ApiResponse<ProjectDetailsResponse>> {
    const qs = new URLSearchParams({ is_evaluation_mode: 'true' })
    if (params?.gradeTypeId != null) qs.set('grade_type_id', String(params.gradeTypeId))
    if (params?.rubricTypeId != null) qs.set('rubric_type_id', String(params.rubricTypeId))
    return request(`${BASE_URL}/projects/project/${projectId}?${qs.toString()}`)
  },

  update(id: string | number, body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  delete(id: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/delete/${id}`, { method: 'DELETE' })
  },

  getAll(): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/projects/get-all`)
  },

  getByFilters(filters: FilterProjectDto = {}): Promise<ApiResponse<ProjectResponse[]>> {
    return request(`${BASE_URL}/projects/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },
}
