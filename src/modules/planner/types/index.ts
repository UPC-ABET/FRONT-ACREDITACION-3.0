export type PlannerSessionStatusValue = 'active' | 'expiring' | 'expired' | 'not_configured';

export interface PlannerSessionStatus {
	status: PlannerSessionStatusValue;
	tokenExp: string | null;
}

export interface PlannerCredentials {
	username: string | null;
	configured: boolean;
	updatedAt: string | null;
}

export interface SavePlannerCredentialsRequest {
	username: string;
	password: string;
}

export interface StartPlannerScrapeRequest {
	level?: string;
	courses?: string[];
}

export interface StartPlannerScrapeResponse {
	runId: string;
}

export type PlannerScrapeRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'expired';

export type PlannerScraperPhase = 'sections' | 'evaluations' | 'grades';

export interface PlannerScrapeCounts {
	sections: number;
	evaluations: number;
	grades: number;
}

export interface PlannerScrapeRunError {
	step: string;
	key: string;
	message: string;
}

export interface PlannerScrapeRunStats {
	courses: {
		requested: string[];
		succeeded: string[];
		failed: string[];
	};
	counts: PlannerScrapeCounts;
	uniqueSections: number;
	errors: PlannerScrapeRunError[];
	fatal?: string;
}

export interface PlannerScrapeRun {
	status: PlannerScrapeRunStatus;
	phase: PlannerScraperPhase | null;
	stats: PlannerScrapeRunStats | null;
}

export interface PlannerScrapeRunSummary {
	runId: string;
	period: string;
	school: string | null;
	status: PlannerScrapeRunStatus;
	phase: PlannerScraperPhase | null;
	startedAt: string;
	finishedAt: string | null;
	counts: PlannerScrapeCounts | null;
	// Still sent by the backend; triggeredByName below is what's displayed. Kept for wire
	// fidelity rather than dropped, since the backend hasn't stopped sending it.
	triggeredBy: string | null;
	triggeredByName: string;
}
