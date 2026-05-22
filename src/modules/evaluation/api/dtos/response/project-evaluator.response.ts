export type ProjectEvaluatorInfoResponse = {
  first_name: string
  last_name: string
  evaluator_type_name: { en: string; es: string }
  evaluator_type_code: string
}

export type ProjectEvaluatorResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  project_id: number
  professor_id: number
  evaluator_type_id: number
  evaluator_info?: ProjectEvaluatorInfoResponse
}

export {}
