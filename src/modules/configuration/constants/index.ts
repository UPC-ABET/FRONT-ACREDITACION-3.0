import type { PeriodModalityCode } from '../types'

// Etiquetas i18n por código de modalidad (el back valida REGULAR | EPE).
export const MODALITY_LABEL_KEYS: Record<PeriodModalityCode, string> = {
  REGULAR: 'configuration.period.modality.regular',
  EPE: 'configuration.period.modality.epe',
}

// Query keys de TanStack Query — centralizadas para invalidación cruzada.
export const CONFIG_QUERY_KEYS = {
  periods: ['configuration', 'periods'] as const,
  studyPlansByPeriod: (periodId: number) => ['configuration', 'periods', periodId, 'study-plans'] as const,
  programCommissionsByPeriod: (periodId: number) => ['configuration', 'periods', periodId, 'program-commissions'] as const,
}
