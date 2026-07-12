import type { ApiResponse } from '@/shared';
import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/lib';
import type {
	OutcomeConversion,
	OutcomeConversionCoverage,
	OutcomeConversionCreate,
	OutcomeConversionFilters,
	OutcomeConversionUpdate,
} from '../types';

const BASE_PATH = '/accreditation/outcome-conversions';

export const outcomeConversionsService = {
	// The active period travels as the X-Academic-Period-Id header; filters.academicPeriodId is
	// only needed to report on a period other than the active one.
	getByFilters(filters: OutcomeConversionFilters): Promise<ApiResponse<OutcomeConversion[]>> {
		return apiPost(`${BASE_PATH}/get-by-filters`, filters);
	},

	coverage(): Promise<ApiResponse<OutcomeConversionCoverage[]>> {
		return apiGet(`${BASE_PATH}/coverage`);
	},

	create(body: OutcomeConversionCreate): Promise<ApiResponse<OutcomeConversion>> {
		return apiPost(`${BASE_PATH}/create`, body);
	},

	update(id: number, body: OutcomeConversionUpdate): Promise<ApiResponse<OutcomeConversion>> {
		return apiPut(`${BASE_PATH}/update/${id}`, body);
	},

	remove(id: number): Promise<ApiResponse<{ id: number }>> {
		return apiDelete(`${BASE_PATH}/delete/${id}`);
	},
};
