import { ApiResponse } from '@/shared'
import { PerformanceLevelResponse } from '../api/dtos'
import { apiPost } from '@/shared/lib'

export type FilterPerformanceLevelDto = Partial<{
  is_active: boolean
  academic_period_id: number
  instrument_type_id: number
}>

export const performanceLevelsService = {
  getByFilters(filters: FilterPerformanceLevelDto): Promise<ApiResponse<PerformanceLevelResponse[]>> {
    return apiPost('/performance-levels/get-by-filters', filters)
  },
}
