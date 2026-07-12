import type { ApiResponse } from '@/shared';
import { apiPost } from '@/shared/lib';
import { PROCESSED_RV_GRADES_BASE_PATH } from '../constants/processedRvGrades';
import type {
	ProcessedRvGradeDto,
	ProcessedRvGradeFilterDto,
	RvGradeRebuildResultDto,
} from '../types';

export const processedRvGradesService = {
	getByFilters(filters: ProcessedRvGradeFilterDto): Promise<ProcessedRvGradeDto[]> {
		return apiPost<ApiResponse<ProcessedRvGradeDto[]>>(
			`${PROCESSED_RV_GRADES_BASE_PATH}/get-by-filters`,
			filters,
		).then((response) => response.data ?? []);
	},

	// Reprocesses every evaluation of the period in the X-Academic-Period-Id header: rewrites the
	// graded rows and re-derives the converted ones from the current formulas.
	rebuild(): Promise<RvGradeRebuildResultDto> {
		return apiPost<ApiResponse<RvGradeRebuildResultDto>>(
			`${PROCESSED_RV_GRADES_BASE_PATH}/rebuild`,
		).then((response) => response.data);
	},
};
