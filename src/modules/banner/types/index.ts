export type BannerSessionStatusValue = 'active' | 'expiring' | 'expired';

export interface BannerSessionStatus {
	status: BannerSessionStatusValue;
	tokenExp: string | null;
}

export interface StartScrapeRequest {
	level?: string;
	departments?: string[];
}

export interface StartScrapeResponse {
	runId: string;
}

export type ScrapeRunStatus = 'running' | 'completed' | 'partial' | 'failed' | 'expired';

export type ScraperPhase = 'schedule' | 'enrollment' | 'studentsAndGrades';

export interface ScrapeCounts {
	schedule: number;
	enrollment: number;
	students: number;
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
	level: string;
	period: string;
	departments: string[];
	status: ScrapeRunStatus;
	phase: ScraperPhase | null;
	startedAt: string;
	finishedAt: string | null;
	counts: ScrapeCounts | null;
	// Still sent by the backend; triggeredByName below is what's displayed. Kept for wire
	// fidelity rather than dropped, since the backend hasn't stopped sending it.
	triggeredBy: string | null;
	triggeredByName: string;
}

export type AuthSessionStatus = 'active' | 'completed' | 'failed' | 'expired';

/** Both optional — pre-fills Microsoft's email/password fields on the remote login page;
 *  never persisted, only forwarded once when the session starts. */
export interface BannerAuthCredentials {
	username: string;
	password: string;
}

export interface StartAuthSessionResponse {
	sessionId: string;
	wsUrl: string;
	sessionToken: string;
	expiresAt: string;
}

export interface AuthSessionState {
	status: AuthSessionStatus;
}
