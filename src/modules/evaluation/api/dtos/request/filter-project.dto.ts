export type FilterProjectDto = Partial<{
  code: string
  is_active: boolean
  name: { es?: string; en?: string }
  description: { es?: string; en?: string }
  extra: Record<string, unknown>
  academic_period_id: number
  program_id: number
  school_id: number
  course_id: number
  student_id: number
  professor_id: number
}>

export {}
