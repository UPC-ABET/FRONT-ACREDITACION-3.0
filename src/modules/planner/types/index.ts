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
	nivel?: string;
	cursos?: string[];
}

export interface StartPlannerScrapeResponse {
	runId: string;
}

export type PlannerScrapeRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'expired';

export type PlannerScraperPhase = 'secciones' | 'evaluaciones' | 'notas';

export interface PlannerScrapeCounts {
	seccion: number;
	evaluacion: number;
	nota: number;
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
	periodo: string;
	escuela: string | null;
	status: PlannerScrapeRunStatus;
	phase: PlannerScraperPhase | null;
	startedAt: string;
	finishedAt: string | null;
	counts: PlannerScrapeCounts | null;
	triggeredBy: string | null;
}
