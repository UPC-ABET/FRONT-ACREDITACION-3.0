import { z } from 'zod'

export const finalizeEvaluationSchema = z.object({
  project_id: z.number(),
  evaluator_id: z.number(),
  is_pa: z.boolean().optional(),
})

export type FinalizeEvaluationInput = z.infer<typeof finalizeEvaluationSchema>

export {}
