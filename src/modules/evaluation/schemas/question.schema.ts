import { z } from 'zod'
import { rubricCriteriaSchema } from './criteria.schema'

export const rubricQuestionSchema = z.object({
  outcome_id: z.number().nullable().optional(),
  question: z.string(),
  criterias: z.array(rubricCriteriaSchema),
})

export type RubricQuestionInput = z.infer<typeof rubricQuestionSchema>

export {}
