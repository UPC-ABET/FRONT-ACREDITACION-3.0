import { ApiResponse } from '@/shared'
import { apiPost, apiPut } from '@/shared/lib'
import type { StudyPlanCourseResponse } from '@/modules/academic/api/dtos/response'

export type StudyPlanCourseFilters = {
  academic_period_id?: number
  school_id?: number
  course_id?: number
  is_active?: boolean
  extra?: Record<string, unknown>
}

export const studyPlanCoursesService = {
  getByFilters(
    filters: StudyPlanCourseFilters,
  ): Promise<ApiResponse<StudyPlanCourseResponse[]>> {
    return apiPost('/study-plan-courses/get-by-filters', filters)
  },

  update(
    id: number,
    body: { extra: Record<string, unknown> },
  ): Promise<ApiResponse<StudyPlanCourseResponse>> {
    return apiPut(`/study-plan-courses/update/${id}`, body)
  },
}
