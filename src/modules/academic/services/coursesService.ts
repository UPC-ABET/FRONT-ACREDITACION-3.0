import { ApiResponse } from '@/shared'
import { FilterCourseRequest } from '../api/dtos/request'
import { CourseResponse, EnrolledStudentResponse } from '../api/dtos/response'
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

export const coursesService = {
  getByFilters(
    filters: FilterCourseRequest = {}
  ): Promise<ApiResponse<CourseResponse[]>> {
    return request(`${BASE_URL}/courses/get-by-filters`, {
      method: 'POST',
      body: JSON.stringify(filters),
    })
  },

  getEnrolledStudents(
    courseId: number,
    filters: {
      is_active?: boolean
      academic_period_id?: number
      campus_id?: number
      study_plan_academic_period_id?: number
    } = {},
  ): Promise<ApiResponse<EnrolledStudentResponse[]>> {
    return request(`${BASE_URL}/courses/${courseId}/enrolled-students`, {
      method: 'POST',
      body: JSON.stringify({ is_active: true, ...filters }),
    })
  },
}
