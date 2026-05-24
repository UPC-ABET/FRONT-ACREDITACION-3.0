export type OutcomeResponse = {
  id: number
  outcome_code: string
  outcome_name: { en: string; es: string }
  outcome_description: { en: string; es: string }
  is_active: boolean
  program_commission_id: number
  program_commission: {
    id: number
    commission_id: number
    commission: {
      id: number
      code: string
      name: { en: string; es: string }
      accreditor_id: number
    }
  }
}