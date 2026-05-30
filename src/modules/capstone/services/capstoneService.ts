import { apiGet, apiPost } from '@/shared/lib/apiClient'
import type { CapstoneProject, CapstoneRubric, SubmitEvaluationPayload } from '../types'

// Stubs de endpoints que el back debe exponer cuando se implemente el módulo evaluation.
// El path raíz coincide con el blueprint — ajustar al integrar si el dominio difiere.
const BASE = '/capstone'

export const listProjects = (professorId: number): Promise<CapstoneProject[]> =>
  apiGet<CapstoneProject[]>(`${BASE}/projects?professor_id=${professorId}`)

export const getRubric = (projectId: number): Promise<CapstoneRubric> =>
  apiGet<CapstoneRubric>(`${BASE}/projects/${projectId}/rubric`)

export const submitEvaluation = (payload: SubmitEvaluationPayload): Promise<{ id: number }> =>
  apiPost<{ id: number }>(`${BASE}/evaluations`, payload)
