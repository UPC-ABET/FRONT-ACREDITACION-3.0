import { ApiResponse } from '@/shared'
import { FilterProgramRequest, } from '../api/dtos/request'
import { ProgramResponse } from '../api/dtos/response'
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

export const programsService = {
  getByFilters(
    filters: FilterProgramRequest = {}
  ): Promise<ApiResponse<ProgramResponse[]>> {
    return request(`${BASE_URL}/programs/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },
}
