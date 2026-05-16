import type { BaseEntity } from '@/shared/types'
import { RubricQuestion } from './question.type'

export type RubricEntity = BaseEntity & {
  rubric_type_id: number
  grade_type_id: number
  study_plan_course_id: number
  is_active: boolean
  extra?: Record<string, unknown>
  questions?: RubricQuestion[]
}

export {}
