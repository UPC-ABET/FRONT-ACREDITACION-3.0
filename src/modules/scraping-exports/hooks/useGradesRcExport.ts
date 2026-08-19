'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { getGradesRcExportStatus, startGradesRcExport } from '../services';
import type { GradesRcExportJobStatus } from '../types';

const GRADES_RC_POLL_INTERVAL_MS = 5_000;

export const isTerminalGradesRcStatus = (status?: GradesRcExportJobStatus['status']): boolean =>
	status === 'completed' || status === 'failed';

export const gradesRcExportQueryKeys = {
	status: (jobId: string) => ['scraping-exports', 'grades-rc-status', jobId] as const,
};

export function useStartGradesRcExport() {
	return useMutation({
		mutationFn: (lang: 'es' | 'en') => startGradesRcExport(lang),
	});
}

// The merge query behind this export can run well past what a synchronous request could
// wait for, so the backend runs it as a background job and this polls its status.
export function useGradesRcExportStatus(jobId: string | null) {
	return useQuery({
		queryKey: gradesRcExportQueryKeys.status(jobId ?? ''),
		queryFn: () => getGradesRcExportStatus(jobId as string),
		enabled: jobId !== null,
		retry: false,
		refetchInterval: (query) =>
			isTerminalGradesRcStatus(query.state.data?.status) ? false : GRADES_RC_POLL_INTERVAL_MS,
	});
}
