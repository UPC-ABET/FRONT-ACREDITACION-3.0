import { ApiResponse } from '@/shared'
import { FilterAcademicPeriodRequest } from '../api/dtos/request'
import { AcademicPeriodResponse } from '../api/dtos/response'
import { apiPost } from '@/shared/lib'

export const academicPeriodsService = {
  getByFilters(
    filters: FilterAcademicPeriodRequest = {}
  ): Promise<ApiResponse<AcademicPeriodResponse[]>> {
    return apiPost('/academic-periods/get-by-filters', filters)
  },
}
