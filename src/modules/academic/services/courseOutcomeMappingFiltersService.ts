import { ApiResponse } from '@/shared';
import { apiGet, apiPost } from '@/shared/lib';
import type {
	AccreditorOption,
	CommissionOption,
	CourseOutcomeMappingFilter,
	CourseOutcomeMappingFilterRow,
	ProgramOption,
} from '../types';

export const courseOutcomeMappingFiltersService = {
	accreditors(): Promise<ApiResponse<AccreditorOption[]>> {
		return apiGet('/accreditors/get-all');
	},

	commissionOptions(accreditorId: number): Promise<ApiResponse<CommissionOption[]>> {
		const query = new URLSearchParams({ accreditorId: String(accreditorId) });
		return apiGet(`/program-commissions/commission-options?${query.toString()}`);
	},

	programOptions(commissionId: number): Promise<ApiResponse<ProgramOption[]>> {
		const query = new URLSearchParams({ commissionId: String(commissionId) });
		return apiGet(`/program-commissions/program-options?${query.toString()}`);
	},

	detailedByFilters(
		filter: CourseOutcomeMappingFilter,
	): Promise<ApiResponse<CourseOutcomeMappingFilterRow[]>> {
		return apiPost('/program-commissions/get-detailed-by-filters', filter);
	},
};
