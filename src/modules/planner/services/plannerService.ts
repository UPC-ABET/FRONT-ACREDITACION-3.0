import { apiGet, apiPost, getApiData } from '@/shared/lib';
import type {
	PlannerScrapeRun,
	PlannerScrapeRunSummary,
	PlannerSessionStatus,
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

export async function startPlannerScrape(
	payload: StartPlannerScrapeRequest = {},
): Promise<StartPlannerScrapeResponse> {
	const body: StartPlannerScrapeRequest = {
		...(payload.nivel ? { nivel: payload.nivel } : {}),
		...(payload.cursos && payload.cursos.length > 0 ? { cursos: payload.cursos } : {}),
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
