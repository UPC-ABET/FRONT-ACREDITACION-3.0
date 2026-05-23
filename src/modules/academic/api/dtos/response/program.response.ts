export type ProgramResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  modality_type_id: number
  code: string
  name: { en: string; es: string }
  degree: { en: string; es: string }
}
