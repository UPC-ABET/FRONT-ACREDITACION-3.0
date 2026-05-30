import { useQuery } from '@tanstack/react-query'
import { listUploadLogs, findUploadLog } from '../services'
import type { UploadLog, UploadLogFilters } from '../types'

export const UPLOAD_HISTORY_KEYS = {
  list: (filters: UploadLogFilters) => ['upload-history', 'list', filters] as const,
  detail: (id: number) => ['upload-history', 'detail', id] as const,
}

export const useUploadHistory = (filters: UploadLogFilters = {}) =>
  useQuery<UploadLog[], Error>({
    queryKey: UPLOAD_HISTORY_KEYS.list(filters),
    queryFn: () => listUploadLogs(filters),
  })

export const useUploadLog = (id: number | null) =>
  useQuery<UploadLog, Error>({
    queryKey: id ? UPLOAD_HISTORY_KEYS.detail(id) : ['upload-history', 'detail', 'noop'],
    queryFn: () => findUploadLog(id as number),
    enabled: id !== null,
  })
