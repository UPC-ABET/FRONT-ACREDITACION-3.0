import type { BaseEntity } from '@/shared/types'
import { EvaluationScore } from './score.type'

export type EvaluationEntity = BaseEntity & {
  project_student_id: number
  project_evaluator_id: number
  observation?: string
  scores?: EvaluationScore[]
}

export {}
