import type { BaseEntity } from '@/shared/types'
import { ProjectStudent } from './student.type'
import { ProjectEvaluator } from './evaluator.type'

export type ProjectEntity = BaseEntity & {
  code: string
  name: string
  description?: string
  students?: ProjectStudent[]
  evaluators?: ProjectEvaluator[]
}

export {}
