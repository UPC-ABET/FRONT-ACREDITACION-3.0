import { BaseEntity } from "@/shared"
import { RubricScoreResponse } from "./rubric-score.response"

export type EvaluationResponse = BaseEntity & {
  project_student_id: number
  project_evaluator_id: number
  observation?: string
  scores?: RubricScoreResponse[]
}

export {}
