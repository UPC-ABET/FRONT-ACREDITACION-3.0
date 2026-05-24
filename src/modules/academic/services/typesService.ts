import { ApiResponse } from '@/shared'
import { apiPost } from '@/shared/lib'
import { TypeItemResponse } from '../api/dtos/response'

export const typesService = {
  getByFilters(filters: { type_group_id?: number }): Promise<ApiResponse<TypeItemResponse[]>> {
    return apiPost('/types/get-by-filters', filters)
  },
}
