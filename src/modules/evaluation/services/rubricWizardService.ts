import { ApiResponse } from '@/shared'
import { apiGet, apiPost } from '@/shared/lib'
import { AcademicPeriodResponse, CourseResponse, StudyPlanCourseResponse, TypeItemResponse } from '@/modules/academic'
import type { CourseOutcomeMappingResponse, OutcomeResponse } from '../types'

export type { CourseOutcomeMappingResponse, OutcomeResponse }

export const rubricWizardService = {
  getAcademicPeriods(): Promise<ApiResponse<AcademicPeriodResponse[]>> {
    return apiGet('/academic-periods/get-all')
  },

  getCoursesByFilters(filters: {
    school_id: number
    academic_period_id: number
    is_active?: boolean
  }): Promise<ApiResponse<CourseResponse[]>> {
    return apiPost('/courses/get-by-filters', filters)
  },

  getStudyPlanCoursesByFilters(filters: {
    course_id: number
    academic_period_id: number
    is_active?: boolean
  }): Promise<ApiResponse<StudyPlanCourseResponse[]>> {
    return apiPost('/study-plan-courses/get-by-filters', filters)
  },

  getTypesByGroupCode(groupCode: string): Promise<ApiResponse<TypeItemResponse[]>> {
    return apiGet(`/types/by-group-code/${groupCode}`)
  },

  getCourseOutcomeMappings(filters: {
    study_plan_course_id: number
    is_active?: boolean
  }): Promise<ApiResponse<CourseOutcomeMappingResponse[]>> {
    return apiPost('/course-outcome-mappings/get-by-filters', filters)
  },

  getOutcomeById(outcomeId: number): Promise<ApiResponse<OutcomeResponse>> {
    return apiGet(`/outcomes/get-by-id/${outcomeId}`)
  },
}
