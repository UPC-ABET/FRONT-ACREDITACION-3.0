export type CreateRubricFullDto = {
  rubric_type_id: number
  grade_type_id: number
  study_plan_course_id: number
  questions: Array<{
    outcome_id?: number
    question: string
    criterias: Array<{
      criteria: string
      min_value: number
      max_value: number
    }>
  }>
}

export {}
