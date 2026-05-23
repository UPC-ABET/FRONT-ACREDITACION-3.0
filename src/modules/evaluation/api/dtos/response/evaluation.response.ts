import { RubricScoreResponse } from "./rubric-score.response"
import { ProjectStudentResponse } from "./project-student.response"

export type EvaluationResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  project_student_id: number
  project_evaluator_id: number
  qualification_status_type_id?: number
  observation?: { en: string; es: string }
  register_at?: string
  project_student?: ProjectStudentResponse
  scores?: RubricScoreResponse[]
}

export {}
