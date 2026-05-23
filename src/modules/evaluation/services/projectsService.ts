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

  getByProfessor(professorId: string | number): Promise<ApiResponse<ProjectByProfessorResponse[]>> {
    return request(`${BASE_URL}/projects/professor/${professorId}`)
  },

  getById(projectId: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/projects/project/${projectId}`)
  },

  getDetails(projectId: string | number): Promise<ApiResponse<ProjectDetailsResponse>> {
    return request(`${BASE_URL}/projects/project/${projectId}?is_evaluation_mode=true`)
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
