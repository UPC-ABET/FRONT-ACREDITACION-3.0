import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listPeriods, createPeriod, closePeriod } from '../services'
import { CONFIG_QUERY_KEYS } from '../constants'
import type { Period, CreatePeriodPayload } from '../types'

export const usePeriods = () =>
  useQuery<Period[], Error>({
    queryKey: CONFIG_QUERY_KEYS.periods,
    queryFn: listPeriods,
  })

export const useCreatePeriod = () => {
  const queryClient = useQueryClient()
  return useMutation<Period, Error, CreatePeriodPayload>({
    mutationFn: createPeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.periods }),
  })
}

export const useClosePeriod = () => {
  const queryClient = useQueryClient()
  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: closePeriod,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEYS.periods }),
  })
}
