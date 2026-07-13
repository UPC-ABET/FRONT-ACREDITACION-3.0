'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { processedRvGradesService } from '../services/processedRvGradesService';
import { performanceReportKeys } from './usePerformanceReports';
import type { ProcessedRvGradeFilterDto } from '../types';

export const processedRvGradeKeys = {
	all: ['evaluation', 'processed-rv-grades'] as const,
	// The period travels in the X-Academic-Period-Id header, so it belongs in the key — otherwise
	// a period switch would serve another period's grades from cache.
	list: (academicPeriodId: number | null, filters: ProcessedRvGradeFilterDto) =>
		[...processedRvGradeKeys.all, 'list', academicPeriodId, filters] as const,
};

export function useProcessedRvGrades(
	filters: ProcessedRvGradeFilterDto,
	academicPeriodId: number | null,
	enabled = true,
) {
	return useQuery({
		queryKey: processedRvGradeKeys.list(academicPeriodId, filters),
		queryFn: () => processedRvGradesService.getByFilters(filters),
		enabled: enabled && academicPeriodId != null,
	});
}

// The rebuild rewrites the processed grades, so both the drill-down and the semaphore report are
// invalidated. Editing a formula alone does not: already-graded evaluations keep their converted
// grades until this runs.
export function useRebuildProcessedRvGrades() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: () => processedRvGradesService.rebuild(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: processedRvGradeKeys.all });
			queryClient.invalidateQueries({ queryKey: performanceReportKeys.all });
		},
	});
}
