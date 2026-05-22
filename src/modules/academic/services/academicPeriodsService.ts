import { ApiResponse } from '@/shared'
import { FilterAcademicPeriodRequest } from '../api/dtos/request'
import { AcademicPeriodResponse } from '../api/dtos/response'
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

export const academicPeriodsService = {
  getByFilters(
    filters: FilterAcademicPeriodRequest = {}
  ): Promise<ApiResponse<AcademicPeriodResponse[]>> {
    return request(`${BASE_URL}/academic-periods/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },
}
