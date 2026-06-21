import { ApiResponse } from '@/shared';
import { apiPost, apiPut, apiDelete } from '@/shared/lib';
import type {
	PerformanceLevelResponse,
	FilterPerformanceLevelDto,
	CreatePerformanceLevelDto,
	UpdatePerformanceLevelDto,
} from '../types';

export const performanceLevelsService = {
	getByFilters(
		filters: FilterPerformanceLevelDto,
	): Promise<ApiResponse<PerformanceLevelResponse[]>> {
		return apiPost('/performance-levels/get-by-filters', filters);
	},

	create(dto: CreatePerformanceLevelDto): Promise<ApiResponse<PerformanceLevelResponse>> {
		return apiPost('/performance-levels/create', dto);
	},

	update(
		id: number,
		dto: UpdatePerformanceLevelDto,
	): Promise<ApiResponse<PerformanceLevelResponse>> {
		return apiPut(`/performance-levels/update/${id}`, dto);
	},

	delete(id: number): Promise<ApiResponse<{ message: string }>> {
		return apiDelete(`/performance-levels/delete/${id}`);
	},
};
