export type CommissionResponse = {
  id: number
  extra?: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string | null
  accreditor_id: number
  code: string
  name: { en: string; es: string }
}

