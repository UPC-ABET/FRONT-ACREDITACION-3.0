import { ApiResponse } from '@/shared';
import { PerformanceLevelResponse } from '../types';
import { apiPost, apiPut, apiDelete } from '@/shared/lib';

export type FilterPerformanceLevelDto = Partial<{
	isActive: boolean;
	academicPeriodId: number;
	instrumentTypeId: number;
}>;

export type CreatePerformanceLevelDto = {
	instrumentTypeId: number;
	academicPeriodId: number;
	name: { es: string; en: string };
	code: string;
	uniqueValue: number;
	minScore: number;
	maxScore: number;
	maxValue: number;
	extra?: { color?: string };
};

export type UpdatePerformanceLevelDto = Partial<CreatePerformanceLevelDto>;

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
