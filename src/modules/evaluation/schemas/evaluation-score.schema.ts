import { z } from 'zod'

export const evaluationScoreSchema = z.object({
  rubric_question_criteria_id: z.number(),
  score: z.number(),
  commentaries: z.string().optional(),
})

export type EvaluationScoreInput = z.infer<typeof evaluationScoreSchema>

export {}
