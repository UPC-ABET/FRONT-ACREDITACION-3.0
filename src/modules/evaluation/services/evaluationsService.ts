import { ApiResponse } from "@/shared"
import { buildJsonHeaders } from '@/shared/lib'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: buildJsonHeaders(options?.headers),
    ...options,
  })
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`)
  return (res.json() as unknown) as T
}

export const evaluationsService = {
  submit(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  saveObservation(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/observation`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  finalize(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/finalize`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  getByStudent(studentId: string | number): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/evaluations/student/${studentId}`)
  },

  getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/evaluations/evaluator/${evaluatorId}`)
  },

  getById(evaluationId: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/evaluation/${evaluationId}`)
  },

  // Generic CRUD
  create(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/create`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },

  update(id: string | number, body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  },

  delete(id: string | number): Promise<ApiResponse<any>> {
    return request(`${BASE_URL}/evaluations/delete/${id}`, { method: 'DELETE' })
  },

  getAll(): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/evaluations/get-all`)
  },

  getByFilters(filters: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return request(`${BASE_URL}/evaluations/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },
}
