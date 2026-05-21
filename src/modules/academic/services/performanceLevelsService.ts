import { ApiResponse } from '@/shared'
import { PerformanceLevelResponse } from '../api/dtos'
import { buildJsonHeaders } from '@/shared/lib'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: buildJsonHeaders(options?.headers),
    ...options,
  })

  if (!response.ok) {
    throw new Error(`[${response.status}] ${response.statusText} — ${url}`)
  }

  return (response.json() as unknown) as T
}

export type FilterPerformanceLevelDto = Partial<{
  is_active: boolean
  academic_period_id: number
  instrument_type_id: number
}>

export const performanceLevelsService = {
  getByFilters(filters: FilterPerformanceLevelDto): Promise<ApiResponse<PerformanceLevelResponse[]>> {
    return request(`${BASE_URL}/performance-levels/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },
}
