export type CreateProjectFullDto = {
  code: string
  name: string
  description?: string
  student_section_enrollment_ids?: number[]
  evaluator_professor_ids?: number[]
}

export {}
