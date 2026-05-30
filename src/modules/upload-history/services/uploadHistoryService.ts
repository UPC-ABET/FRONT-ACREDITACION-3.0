import { apiGet, getApiData } from '@/shared/lib/apiClient'
import type { UploadLog, UploadLogFilters } from '../types'

const BASE = '/uploads/upload-logs'

// The backend wraps every response in { code, message, data }; getApiData unwraps the `data` payload.

export const listUploadLogs = async (filters: UploadLogFilters = {}): Promise<UploadLog[]> => {
  const params = new URLSearchParams()
  if (filters.upload_type) params.set('upload_type', filters.upload_type)
  if (filters.status) params.set('status', filters.status)
  if (filters.academic_period_id !== undefined) params.set('academic_period_id', String(filters.academic_period_id))
  if (filters.limit !== undefined) params.set('limit', String(filters.limit))
  if (filters.offset !== undefined) params.set('offset', String(filters.offset))
  const qs = params.toString()
  return getApiData<UploadLog[]>(await apiGet(`${BASE}${qs ? `?${qs}` : ''}`))
}

export const findUploadLog = async (id: number): Promise<UploadLog> =>
  getApiData<UploadLog>(await apiGet(`${BASE}/${id}`))
