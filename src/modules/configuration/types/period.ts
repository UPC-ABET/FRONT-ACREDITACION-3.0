// Tipos del módulo de configuración Fase 0 — espejo de los DTOs/responses del back
// (ABET-CARGAS/back/src/modules/configuration/periods/periods.dtos.ts).

export const PERIOD_MODALITY_CODES = ['REGULAR', 'EPE'] as const
export type PeriodModalityCode = (typeof PERIOD_MODALITY_CODES)[number]

export const PERIOD_CODE_PATTERN = /^\d{4}-(01|02|00)$/

export interface Period {
  id: number
  code: string
  start_date: string
  end_date: string
  modality_type_id: number
  status: string
}

export interface CreatePeriodPayload {
  code: string
  start_date: string
  end_date: string
  modality_code: PeriodModalityCode
}
