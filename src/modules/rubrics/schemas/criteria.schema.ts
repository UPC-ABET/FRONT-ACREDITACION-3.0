import { z } from 'zod'

export const rubricCriteriaSchema = z.object({
  criteria: z.string(),
  min_value: z.number(),
  max_value: z.number(),
})

export type RubricCriteriaInput = z.infer<typeof rubricCriteriaSchema>

export {}
