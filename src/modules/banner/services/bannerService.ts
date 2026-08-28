import { API_URL, apiDelete, apiGet, apiPost, getApiData } from '@/shared/lib';
import type {
	AuthSessionState,
	BannerAuthCredentials,
	BannerSessionStatus,
	ScrapeRun,
	ScrapeRunSummary,
	StartAuthSessionResponse,
	StartScrapeRequest,
	StartScrapeResponse,
} from '../types';

export async function getBannerSessionStatus(): Promise<BannerSessionStatus> {
	const res = await apiGet('/banner/session/status');
	return getApiData<BannerSessionStatus>(res);
}

export async function refreshBannerSession(): Promise<BannerSessionStatus> {
	const res = await apiPost('/banner/session/refresh');
	return getApiData<BannerSessionStatus>(res);
}

export async function startBannerScrape(
	payload: StartScrapeRequest = {},
): Promise<StartScrapeResponse> {
	const body: StartScrapeRequest = {
		...(payload.level ? { level: payload.level } : {}),
		...(payload.departments && payload.departments.length > 0
			? { departments: payload.departments }
			: {}),
	};
	const res = await apiPost('/banner/scrape', body);
	return getApiData<StartScrapeResponse>(res);
}

export async function listBannerScrapeRuns(): Promise<ScrapeRunSummary[]> {
	const res = await apiGet('/banner/scrape');
	return getApiData<ScrapeRunSummary[]>(res) ?? [];
}

export async function getBannerScrapeRun(runId: string): Promise<ScrapeRun> {
	const res = await apiGet(`/banner/scrape/${runId}`);
	return getApiData<ScrapeRun>(res);
}

export async function startBannerAuthSession(
	credentials?: BannerAuthCredentials,
): Promise<StartAuthSessionResponse> {
	const res = await apiPost('/banner/auth/sessions', credentials ?? {});
	return getApiData<StartAuthSessionResponse>(res);
}

export async function getBannerAuthSession(sessionId: string): Promise<AuthSessionState> {
	const res = await apiGet(`/banner/auth/sessions/${sessionId}`);
	return getApiData<AuthSessionState>(res);
}

export async function cancelBannerAuthSession(sessionId: string): Promise<AuthSessionState> {
	const res = await apiDelete(`/banner/auth/sessions/${sessionId}`);
	return getApiData<AuthSessionState>(res);
}

export function buildBannerStreamUrl(wsUrl: string): string {
	if (/^wss?:\/\//i.test(wsUrl)) return wsUrl;
	if (/^https?:\/\//i.test(wsUrl)) return wsUrl.replace(/^http/i, 'ws');

	const wsOrigin = new URL(API_URL).origin.replace(/^http/i, 'ws');
	return `${wsOrigin}${wsUrl.startsWith('/') ? '' : '/'}${wsUrl}`;
}
