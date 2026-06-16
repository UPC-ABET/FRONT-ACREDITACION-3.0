import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	getPlannerScrapeRun,
	getPlannerSessionStatus,
	listPlannerScrapeRuns,
	refreshPlannerSession,
	startPlannerScrape,
} from '../services';
import type { PlannerScrapeRunStatus } from '../types';

const TERMINAL_STATUSES: PlannerScrapeRunStatus[] = ['completed', 'partial', 'failed', 'expired'];

export const isTerminalPlannerScrapeStatus = (status?: PlannerScrapeRunStatus): boolean =>
	status !== undefined && TERMINAL_STATUSES.includes(status);

const SCRAPE_POLL_INTERVAL_MS = 3_000;

export const plannerQueryKeys = {
	all: ['planner'] as const,
	sessionStatus: () => [...plannerQueryKeys.all, 'session-status'] as const,
	scrapeRuns: (periodId: number) => [...plannerQueryKeys.all, 'scrape-runs', periodId] as const,
	scrapeRun: (runId: string) => [...plannerQueryKeys.all, 'scrape-run', runId] as const,
};

export function usePlannerSessionStatus() {
	return useQuery({
		queryKey: plannerQueryKeys.sessionStatus(),
		queryFn: getPlannerSessionStatus,
		staleTime: 30_000,
		refetchInterval: 60_000,
	});
}

export function useRefreshPlannerSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => refreshPlannerSession(),
		onSuccess: (data) => {
			queryClient.setQueryData(plannerQueryKeys.sessionStatus(), data);
		},
	});
}

export function useStartPlannerScrape() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => startPlannerScrape(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: plannerQueryKeys.all });
		},
	});
}

export function usePlannerScrapeRuns(periodId: number | null) {
	return useQuery({
		queryKey: plannerQueryKeys.scrapeRuns(periodId ?? 0),
		queryFn: listPlannerScrapeRuns,
		enabled: Boolean(periodId),
		refetchInterval: (query) =>
			(query.state.data ?? []).some((run) => !isTerminalPlannerScrapeStatus(run.status))
				? SCRAPE_POLL_INTERVAL_MS
				: false,
	});
}

export function usePlannerScrapeRun(runId: string | null) {
	return useQuery({
		queryKey: plannerQueryKeys.scrapeRun(runId ?? ''),
		queryFn: () => getPlannerScrapeRun(runId as string),
		enabled: Boolean(runId),
		refetchInterval: (query) =>
			isTerminalPlannerScrapeStatus(query.state.data?.status) ? false : SCRAPE_POLL_INTERVAL_MS,
	});
}
