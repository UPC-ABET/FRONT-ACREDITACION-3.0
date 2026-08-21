export type BannerSessionStatusValue = 'active' | 'expiring' | 'expired';

export interface BannerSessionStatus {
	status: BannerSessionStatusValue;
	tokenExp: string | null;
}

export interface StartScrapeRequest {
	nivel?: string;
	departamentos?: string[];
}

export interface StartScrapeResponse {
	runId: string;
}

export type ScrapeRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'expired';

export type ScraperPhase = 'horario' | 'matricula' | 'alumnosYNotas';

export interface ScrapeCounts {
	horario: number;
	matricula: number;
	alumno: number;
}

export interface ScrapeRunError {
	step: string;
	key: string;
	message: string;
}

export interface ScrapeRunStats {
	departments: {
		requested: string[];
		succeeded: string[];
		failed: string[];
	};
	counts: ScrapeCounts;
	uniqueStudents: number;
	errors: ScrapeRunError[];
	fatal?: string;
}

export interface ScrapeRun {
	status: ScrapeRunStatus;
	phase: ScraperPhase | null;
	stats: ScrapeRunStats | null;
}

export interface ScrapeRunSummary {
	runId: string;
	nivel: string;
	periodo: string;
	departamentos: string[];
	status: ScrapeRunStatus;
	phase: ScraperPhase | null;
	startedAt: string;
	finishedAt: string | null;
	counts: ScrapeCounts | null;
	triggeredBy: string | null;
}

export type AuthSessionStatus = 'active' | 'completed' | 'failed' | 'expired';

export interface StartAuthSessionResponse {
	sessionId: string;
	wsUrl: string;
	sessionToken: string;
	expiresAt: string;
}

export interface AuthSessionState {
	status: AuthSessionStatus;
}
