import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  listNotificationConfigs,
  upsertNotificationConfig,
  deleteNotificationConfig,
} from '../services/notificationConfigsService'
import type { UpsertConfigBody } from '../services/types'

export const notificationConfigsQueryKeys = {
  all: ['notification-configs'] as const,
  byPeriod: (periodId: number) => ['notification-configs', 'byPeriod', periodId] as const,
}

export function useNotificationConfigsByPeriod(
  periodId: number | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: notificationConfigsQueryKeys.byPeriod(periodId ?? 0),
    queryFn: () => listNotificationConfigs(periodId!),
    enabled: (options?.enabled ?? true) && periodId != null,
  })
}

export function useUpsertNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertConfigBody) => upsertNotificationConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationConfigsQueryKeys.all })
    },
  })
}

export function useDeleteNotificationConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteNotificationConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationConfigsQueryKeys.all })
    },
  })
}
