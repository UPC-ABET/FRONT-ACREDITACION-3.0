import { apiGet, apiPost, getApiData } from '@/shared/lib';
import type {
	PlannerCredentials,
	PlannerScrapeRun,
	PlannerScrapeRunSummary,
	PlannerSessionStatus,
	SavePlannerCredentialsRequest,
	StartPlannerScrapeRequest,
	StartPlannerScrapeResponse,
} from '../types';

export async function getPlannerSessionStatus(): Promise<PlannerSessionStatus> {
	const res = await apiGet('/planner/session/status');
	return getApiData<PlannerSessionStatus>(res);
}

export async function refreshPlannerSession(): Promise<PlannerSessionStatus> {
	const res = await apiPost('/planner/session/refresh');
	return getApiData<PlannerSessionStatus>(res);
}

export async function getPlannerCredentials(): Promise<PlannerCredentials> {
	const res = await apiGet('/planner/session/credentials');
	return getApiData<PlannerCredentials>(res);
}

export async function savePlannerCredentials(
	payload: SavePlannerCredentialsRequest,
): Promise<PlannerSessionStatus> {
	const res = await apiPost('/planner/session/credentials', payload);
	return getApiData<PlannerSessionStatus>(res);
}

export async function startPlannerScrape(
	payload: StartPlannerScrapeRequest = {},
): Promise<StartPlannerScrapeResponse> {
	const body: StartPlannerScrapeRequest = {
		...(payload.level ? { level: payload.level } : {}),
		...(payload.courses && payload.courses.length > 0 ? { courses: payload.courses } : {}),
	};
	const res = await apiPost('/planner/scrape', body);
	return getApiData<StartPlannerScrapeResponse>(res);
}

export async function listPlannerScrapeRuns(): Promise<PlannerScrapeRunSummary[]> {
	const res = await apiGet('/planner/scrape');
	return getApiData<PlannerScrapeRunSummary[]>(res) ?? [];
}

export async function getPlannerScrapeRun(runId: string): Promise<PlannerScrapeRun> {
	const res = await apiGet(`/planner/scrape/${runId}`);
	return getApiData<PlannerScrapeRun>(res);
}
