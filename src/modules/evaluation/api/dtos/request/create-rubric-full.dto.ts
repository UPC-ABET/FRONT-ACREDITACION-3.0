export type CreateRubricFullDto = {
  rubric_type_id: number
  grade_type_id: number
  study_plan_course_id: number
  is_active?: boolean
  extra?: Record<string, unknown>
  questions: Array<{
    outcome_id?: number
    question: { es: string; en: string } | string
    criterias: Array<{
      criteria: { es: string; en: string } | string
      min_value: number
      max_value: number
    }>
  }>
}

export {};
