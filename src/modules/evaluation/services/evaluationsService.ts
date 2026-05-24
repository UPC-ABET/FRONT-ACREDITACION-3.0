import { ApiResponse } from "@/shared"
import { apiGet, apiPost, apiPut, apiDelete } from '@/shared/lib'
import { EvaluationResponse } from '../api/dtos/response'

export const evaluationsService = {
  submit(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return apiPost('/evaluations/submit', body)
  },

  saveObservation(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return apiPut('/evaluations/observation', body)
  },

  finalize(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return apiPost('/evaluations/finalize', body)
  },

  getByStudent(studentId: string | number): Promise<ApiResponse<any[]>> {
    return apiGet(`/evaluations/student/${studentId}`)
  },

  getByEvaluator(evaluatorId: string | number): Promise<ApiResponse<EvaluationResponse[]>> {
    return apiGet(`/evaluations/evaluator/${evaluatorId}`)
  },

  getById(evaluationId: string | number): Promise<ApiResponse<any>> {
    return apiGet(`/evaluations/evaluation/${evaluationId}`)
  },

  // Generic CRUD
  create(body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return apiPost('/evaluations/create', body)
  },

  update(id: string | number, body: Record<string, unknown>): Promise<ApiResponse<any>> {
    return apiPut(`/evaluations/update/${id}`, body)
  },

  delete(id: string | number): Promise<ApiResponse<any>> {
    return apiDelete(`/evaluations/delete/${id}`)
  },

  getAll(): Promise<ApiResponse<any[]>> {
    return apiGet('/evaluations/get-all')
  },

  getByFilters(filters: Record<string, unknown>): Promise<ApiResponse<any[]>> {
    return apiPost('/evaluations/get-by-filters', filters)
  },
}
