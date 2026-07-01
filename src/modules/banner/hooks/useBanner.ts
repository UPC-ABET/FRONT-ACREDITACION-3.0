import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
	cancelBannerAuthSession,
	getBannerAuthSession,
	getBannerScrapeRun,
	getBannerSessionStatus,
	listBannerScrapeRuns,
	refreshBannerSession,
	startBannerAuthSession,
	startBannerScrape,
} from '../services';
import type { ScrapeRunStatus } from '../types';

const TERMINAL_STATUSES: ScrapeRunStatus[] = ['completed', 'partial', 'failed', 'expired'];

export const isTerminalScrapeStatus = (status?: ScrapeRunStatus): boolean =>
	status !== undefined && TERMINAL_STATUSES.includes(status);

const SCRAPE_POLL_INTERVAL_MS = 3_000;
const AUTH_SESSION_POLL_INTERVAL_MS = 2_000;

export const bannerQueryKeys = {
	all: ['banner'] as const,
	sessionStatus: () => [...bannerQueryKeys.all, 'session-status'] as const,
	scrapeRuns: (periodId: number) => [...bannerQueryKeys.all, 'scrape-runs', periodId] as const,
	scrapeRun: (runId: string) => [...bannerQueryKeys.all, 'scrape-run', runId] as const,
	authSession: (sessionId: string) => [...bannerQueryKeys.all, 'auth-session', sessionId] as const,
};

export function useBannerSessionStatus() {
	return useQuery({
		queryKey: bannerQueryKeys.sessionStatus(),
		queryFn: getBannerSessionStatus,
		staleTime: 30_000,
		refetchInterval: 60_000,
	});
}

export function useRefreshBannerSession() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => refreshBannerSession(),
		onSuccess: (data) => {
			queryClient.setQueryData(bannerQueryKeys.sessionStatus(), data);
		},
	});
}

export function useStartBannerScrape() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => startBannerScrape(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bannerQueryKeys.all });
		},
	});
}

export function useBannerScrapeRuns(periodId: number | null) {
	return useQuery({
		queryKey: bannerQueryKeys.scrapeRuns(periodId ?? 0),
		queryFn: listBannerScrapeRuns,
		placeholderData: (previousData) => previousData,
		enabled: Boolean(periodId),
		refetchInterval: (query) =>
			(query.state.data ?? []).some((run) => !isTerminalScrapeStatus(run.status))
				? SCRAPE_POLL_INTERVAL_MS
				: false,
	});
}

export function useBannerScrapeRun(runId: string | null) {
	return useQuery({
		queryKey: bannerQueryKeys.scrapeRun(runId ?? ''),
		queryFn: () => getBannerScrapeRun(runId as string),
		enabled: Boolean(runId),
		refetchInterval: (query) =>
			isTerminalScrapeStatus(query.state.data?.status) ? false : SCRAPE_POLL_INTERVAL_MS,
	});
}

export function useStartBannerAuthSession() {
	return useMutation({
		mutationFn: () => startBannerAuthSession(),
	});
}

export function useCancelBannerAuthSession() {
	return useMutation({
		mutationFn: (sessionId: string) => cancelBannerAuthSession(sessionId),
	});
}

export function useBannerAuthSession(sessionId: string | null) {
	return useQuery({
		queryKey: bannerQueryKeys.authSession(sessionId ?? ''),
		queryFn: () => getBannerAuthSession(sessionId as string),
		enabled: Boolean(sessionId),
		refetchInterval: (query) =>
			query.state.data?.status && query.state.data.status !== 'active'
				? false
				: AUTH_SESSION_POLL_INTERVAL_MS,
	});
}
