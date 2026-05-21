type I18nText = { es: string; en: string }

export type UpdateRubricCriteriaDto = {
  id?: number
  criteria: I18nText
  min_value: number
  max_value: number
}

export type UpdateRubricQuestionDto = {
  id?: number
  outcome_id?: number
  question: I18nText
  criterias: UpdateRubricCriteriaDto[]
}

export type UpdateRubricDto = {
  rubric_type_id?: number
  grade_type_id?: number
  study_plan_course_id?: number
  is_active?: boolean
  extra?: Record<string, unknown>
  questions?: UpdateRubricQuestionDto[]
}

export {}
