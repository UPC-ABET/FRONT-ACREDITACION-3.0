// Asociación programa×comisión×período. Espejo de ProgramCommissionsService.

export interface ProgramCommission {
  id: number
  academic_period_id: number
  program_id: number
  commission_id: number
  program_code: string
  commission_code: string
}

export interface AssociateProgramCommissionPayload {
  periodId: number
  programId: number
  commissionId: number
}

export interface UnassociateProgramCommissionPayload {
  periodId: number
  id: number
}
