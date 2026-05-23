export type RubricScoreResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  evaluation_id: number
  rubric_question_criteria_id: number
  score: number
  commentaries?: { en: string; es: string }
}

export {}
