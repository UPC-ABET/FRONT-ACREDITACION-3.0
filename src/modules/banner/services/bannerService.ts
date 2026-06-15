import { API_URL, apiDelete, apiGet, apiPost, getApiData } from '@/shared/lib';
import type {
	AuthSessionState,
	BannerSessionStatus,
	ScrapeRun,
	StartAuthSessionResponse,
	StartScrapeRequest,
	StartScrapeResponse,
} from '../types';

export async function getBannerSessionStatus(): Promise<BannerSessionStatus> {
	const res = await apiGet('/banner/session/status');
	return getApiData<BannerSessionStatus>(res);
}

export async function startBannerScrape(payload: StartScrapeRequest): Promise<StartScrapeResponse> {
	const body: StartScrapeRequest = {
		periodo: payload.periodo,
		...(payload.nivel ? { nivel: payload.nivel } : {}),
		...(payload.departamentos && payload.departamentos.length > 0
			? { departamentos: payload.departamentos }
			: {}),
	};
	const res = await apiPost('/banner/scrape', body);
	return getApiData<StartScrapeResponse>(res);
}

export async function getBannerScrapeRun(runId: string): Promise<ScrapeRun> {
	const res = await apiGet(`/banner/scrape/${runId}`);
	return getApiData<ScrapeRun>(res);
}

export async function startBannerAuthSession(): Promise<StartAuthSessionResponse> {
	const res = await apiPost('/banner/auth/sessions');
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
	const origin = new URL(API_URL).origin;
	const wsOrigin = origin.replace(/^http/, 'ws');
	return `${wsOrigin}${wsUrl}`;
}
