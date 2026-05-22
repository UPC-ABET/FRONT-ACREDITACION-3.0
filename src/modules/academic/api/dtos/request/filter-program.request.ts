export type FilterProgramRequest = Partial<{
  extra: Record<string, unknown>
  is_active: boolean
  modality_type_id: number
  code: string
  name: { es?: string; en?: string }
  degree: { es?: string; en?: string }
  academic_period_id: number
  school_code: string
}>
