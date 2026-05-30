import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listProgramCommissionsByPeriod, associateProgramCommission, unassociateProgramCommission } from '../services'
import { CONFIG_QUERY_KEYS } from '../constants'
import type { ProgramCommission, AssociateProgramCommissionPayload, UnassociateProgramCommissionPayload } from '../types'

export const useProgramCommissions = (periodId: number | null) =>
  useQuery<ProgramCommission[], Error>({
    queryKey: periodId ? CONFIG_QUERY_KEYS.programCommissionsByPeriod(periodId) : ['configuration', 'program-commissions', 'noop'],
    queryFn: () => (periodId ? listProgramCommissionsByPeriod(periodId) : Promise.resolve([])),
    enabled: !!periodId,
  })

export const useAssociateProgramCommission = (periodId: number | null) => {
  const queryClient = useQueryClient()
  return useMutation<ProgramCommission, Error, AssociateProgramCommissionPayload>({
    mutationFn: associateProgramCommission,
    onSuccess: () => {
      if (periodId) queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.programCommissionsByPeriod(periodId) })
    },
  })
}

export const useUnassociateProgramCommission = (periodId: number | null) => {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, UnassociateProgramCommissionPayload>({
    mutationFn: unassociateProgramCommission,
    onSuccess: () => {
      if (periodId) queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.programCommissionsByPeriod(periodId) })
    },
  })
}
