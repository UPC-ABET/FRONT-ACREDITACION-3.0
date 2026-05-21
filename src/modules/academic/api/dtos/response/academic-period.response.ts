export type AcademicPeriodResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  modality_type_Id: number
  code: string
  start_date: string
  end_date: string
}