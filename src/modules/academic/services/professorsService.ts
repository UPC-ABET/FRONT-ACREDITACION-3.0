import { ApiResponse } from "@/shared"
import { buildJsonHeaders } from '@/shared/lib'
import { ProfessorResponse } from '../api/dtos/response'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: buildJsonHeaders(options?.headers),
    ...options,
  })
  if (!res.ok) throw new Error(`[${res.status}] ${res.statusText} — ${url}`)
  return (res.json() as unknown) as T
}

export const professorsService = {
  getByUserId(userId: string | number): Promise<ApiResponse<ProfessorResponse>> {
    return request(`${BASE_URL}/professors/get-by-user-id/${userId}`)
  },
}
