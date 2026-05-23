export type CreateProjectFullDto = {
  code: string
  name: { en: string; es: string }
  description?: { en: string; es: string }
  student_section_enrollment_ids?: number[]
  evaluator_professor_ids?: number[]
}

export {}
