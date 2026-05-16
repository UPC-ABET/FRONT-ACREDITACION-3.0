export type UpdateRubricDto = Partial<{
  rubric_type_id: number
  grade_type_id: number
  study_plan_course_id: number
}> & {
  is_active?: boolean
}

export {}
