import { ApiResponse } from '@/shared';
import { PerformanceLevelResponse } from '../api/dtos';
import { apiPost, apiPut, apiDelete } from '@/shared/lib';

export type FilterPerformanceLevelDto = Partial<{
	is_active: boolean;
	academic_period_id: number;
	instrument_type_id: number;
}>;

export type CreatePerformanceLevelDto = {
	instrument_type_id: number;
	academic_period_id: number;
	name: { es: string; en: string };
	code: string;
	unique_value: number;
	min_score: number;
	max_score: number;
	max_value: number;
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
