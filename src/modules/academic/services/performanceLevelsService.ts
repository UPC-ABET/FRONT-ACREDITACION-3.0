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
		return apiPost('/performance-levels/get-by-filters', {
			isActive: filters.isActive,
			instrumentTypeId: filters.instrumentTypeId,
		});
	},

	create(dto: CreatePerformanceLevelDto): Promise<ApiResponse<PerformanceLevelResponse>> {
		return apiPost('/performance-levels/create', {
			instrumentTypeId: dto.instrumentTypeId,
			name: dto.name,
			code: dto.code,
			uniqueValue: dto.uniqueValue,
			minScore: dto.minScore,
			maxScore: dto.maxScore,
			maxValue: dto.maxValue,
			extra: dto.extra,
		});
	},

	update(
		id: number,
		dto: UpdatePerformanceLevelDto,
	): Promise<ApiResponse<PerformanceLevelResponse>> {
		return apiPut(`/performance-levels/update/${id}`, {
			instrumentTypeId: dto.instrumentTypeId,
			name: dto.name,
			code: dto.code,
			uniqueValue: dto.uniqueValue,
			minScore: dto.minScore,
			maxScore: dto.maxScore,
			maxValue: dto.maxValue,
			extra: dto.extra,
		});
	},

	delete(id: number): Promise<ApiResponse<{ message: string }>> {
		return apiDelete(`/performance-levels/delete/${id}`);
	},
};
