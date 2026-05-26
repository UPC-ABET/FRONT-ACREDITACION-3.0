import { ApiResponse } from '@/shared';
import { FilterAcademicPeriodRequest, AcademicPeriodResponse } from '../types';
import { apiPost } from '@/shared/lib';

export const academicPeriodsService = {
	getByFilters(
		filters: FilterAcademicPeriodRequest = {},
	): Promise<ApiResponse<AcademicPeriodResponse[]>> {
		return apiPost('/academic-periods/get-by-filters', filters);
	},
};
